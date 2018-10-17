"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const c4utils_1 = require("c4utils");
const CONTROLLER_OPTIONS_KEY = "c4webservice:controller_options";
/**
 *
 * @param path 路由的主路径，若为空字符串，则忽略
 * @type string
 */
function RestController(path) {
    return function (target) {
        let ControllerOptions = getControllerOptions(target);
        ControllerOptions.MainPath = path || '';
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    };
}
exports.RestController = RestController;
/**
 *
 * @param config controller级别的配置
 * @type ControllerConfig
 */
function RequestMapping(config) {
    return function (target, key, descriptor) {
        let ControllerOptions = getControllerOptions(target);
        let CurOptions = Object.assign({
            Name: key
        }, config);
        CurOptions.Handler = descriptor.value;
        ControllerOptions.Options.push(CurOptions);
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    };
}
exports.RequestMapping = RequestMapping;
/**
 *
 * @param options url query的配置
 * @type
 * {
 *  value  : string,
 *  required ?: boolean,
 *  defaultValue ?: any
 * }
 */
function RequestParam(options) {
    return function (target, key, index) {
        let ControllerOptions = getControllerOptions(target);
        let CurOptions = Object.assign({
            index: index
        }, options);
        if (c4utils_1.TypeUtils.isEmptyObj(CurOptions.value)) {
            CurOptions.value = key;
        }
        if (c4utils_1.TypeUtils.isEmptyObj(CurOptions.required)) {
            CurOptions.required = false;
        }
        if (ControllerOptions.Params === undefined) {
            ControllerOptions.Params = {};
        }
        if (c4utils_1.TypeUtils.isEmptyObj(ControllerOptions.Params[key])) {
            ControllerOptions.Params[key] = [];
        }
        ControllerOptions.Params[key].push(CurOptions);
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    };
}
exports.RequestParam = RequestParam;
/**
 *
 * @param options body配置
 * @type
 * {
 *  value : string
 * }
 */
function RequestBody(options) {
    return function (target, key, index) {
        let ControllerOptions = getControllerOptions(target);
        let CurOptions = Object.assign({
            index: index
        }, options);
        if (c4utils_1.TypeUtils.isEmptyObj(CurOptions.value)) {
            CurOptions.value = key;
        }
        if (c4utils_1.TypeUtils.isEmptyObj(CurOptions.required)) {
            CurOptions.required = false;
        }
        if (ControllerOptions.Body === undefined) {
            ControllerOptions.Body = {};
        }
        if (c4utils_1.TypeUtils.isEmptyObj(ControllerOptions.Body[key])) {
            ControllerOptions.Body[key] = [];
        }
        // ControllerOptions.Body[key].push({
        //     index : index,
        //     value : options.value
        // });
        ControllerOptions.Body[key].push(CurOptions);
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    };
}
exports.RequestBody = RequestBody;
function getControllerOptions(target) {
    let ControllerOptions = Reflect.getMetadata(CONTROLLER_OPTIONS_KEY, target);
    if (ControllerOptions === undefined) {
        ControllerOptions = {
            MainPath: "",
            Options: []
        };
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    }
    return ControllerOptions;
}
exports.getControllerOptions = getControllerOptions;
function getRequest(...args) {
    return arguments[arguments.length - 2];
}
exports.getRequest = getRequest;
function getResponse(...args) {
    return arguments[arguments.length - 1];
}
exports.getResponse = getResponse;
function getSession(...args) {
    return getRequest(...arguments).session;
}
exports.getSession = getSession;
function setSession(name, sessionData, ...args) {
    let req = getRequest(...args);
    if (c4utils_1.TypeUtils.isEmptyObj(req.session)) {
        console.warn('[C4WebService] not init Session, but call setSession.');
        return; // 没有定义Session选项
    }
    req.session[name] = sessionData;
}
exports.setSession = setSession;
function saveSession(...args) {
    return __awaiter(this, arguments, void 0, function* () {
        let Session = getSession(...arguments);
        if (Session) {
            yield new Promise((resolve, reject) => {
                Session.save((err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        }
    });
}
exports.saveSession = saveSession;
function regenerateSession(...args) {
    return __awaiter(this, arguments, void 0, function* () {
        let Session = getSession(...arguments);
        if (Session) {
            yield new Promise((resolve, reject) => {
                Session.regenerate((err) => {
                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        }
    });
}
exports.regenerateSession = regenerateSession;
function getJWT(...args) {
    return getRequest(...arguments).jwt;
}
exports.getJWT = getJWT;
/**
 * 对JWT的payload进行加密处理
 */
function setJWT(name, jwtData, ...args) {
    let jwt = getJWT(...args);
    jwt.payload = jwt.jwt.setJWT(jwt.payload, name, jwtData);
}
exports.setJWT = setJWT;
// 创建JWT
function generateJWT(audience, ...args) {
    return __awaiter(this, void 0, void 0, function* () {
        let jwt = getJWT(...args);
        let Token = yield jwt.jwt.generateJWT(audience, jwt.payload);
        jwt.token = Token;
        return Token;
    });
}
exports.generateJWT = generateJWT;
/**
 * 刷新JWT
 * @param args
 * 会抛异常
 */
function refreshJWT(...args) {
    return __awaiter(this, void 0, void 0, function* () {
        let jwt = getJWT(...args);
        if (c4utils_1.TypeUtils.isEmptyStr(jwt.token)) {
            return false;
        }
        let Token = yield jwt.jwt.refreshJWT(jwt.token);
        jwt.token = Token;
        return Token;
    });
}
exports.refreshJWT = refreshJWT;
/**
 * 撤销JWT
 * @param args
 * 会抛异常
 */
function revokeJWT(...args) {
    return __awaiter(this, void 0, void 0, function* () {
        let jwt = getJWT(...args);
        if (c4utils_1.TypeUtils.isEmptyStr(jwt.token)) {
            return false;
        }
        let Res = yield jwt.jwt.revokeJWT(jwt.token);
        return Res;
    });
}
exports.revokeJWT = revokeJWT;
// 获取Auth信息
function getACL(...args) {
    return getRequest(...arguments).acl;
}
exports.getACL = getACL;
// 获取multiPart
function getMultipart(...args) {
    return getRequest(...arguments).formData;
}
exports.getMultipart = getMultipart;
// 获取logger
function getLogger(...args) {
    return getRequest(...args).logger;
}
exports.getLogger = getLogger;
//# sourceMappingURL=Controller.js.map