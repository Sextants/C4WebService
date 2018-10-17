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
const Express = require("express");
const glob = require("glob");
const Path = require("path");
const MultiParty = require("multiparty");
const XML2JS = require("xml2js");
const c4utils_1 = require("c4utils");
const Controller_1 = require("./Controller");
const c4accesscontrol_1 = require("c4accesscontrol");
function isImportable(file) {
    const filePart = file.slice(-3);
    return filePart === '.js' || (filePart === '.ts' && file.slice(-5) !== '.d.ts');
}
function getFullfilepathWithoutExtension(file) {
    const parsedFile = Path.parse(file);
    return Path.join(parsedFile.dir, parsedFile.name);
}
function getFilenameWithoutExtension(file) {
    return Path.parse(file).name;
}
const uniqueFilter = (item, index, arr) => arr.indexOf(item) === index;
function getControllers(arg, debug = false) {
    let TargetDir = [
        './Controllers',
        './out/Controllers/'
    ];
    if (c4utils_1.TypeUtils.isArray(arg) && arg.length > 0) {
        let Models = [];
        for (let i = 0; i < TargetDir.length; i++) {
            let LoadPaths = arg.reduce((paths, dir) => {
                if (c4utils_1.TypeUtils.isObject(dir)
                    && dir.dir
                    && c4utils_1.TypeUtils.isString(dir.dir)
                    && !c4utils_1.TypeUtils.isEmptyStr(dir.dir)) {
                    if (!glob.hasMagic(dir.dir)) {
                        let parsedFile = Path.parse(dir.dir);
                        let curPath = Path.join(parsedFile.dir, parsedFile.name);
                        let fullPath = Path.join(process.cwd(), TargetDir[i], curPath, '*.*');
                        let IsInside = c4utils_1.PathUtils.PathInside(process.cwd(), fullPath);
                        if (IsInside) {
                            paths.push(fullPath);
                            return paths;
                        }
                    }
                }
                else if (c4utils_1.TypeUtils.isString(dir)
                    && !c4utils_1.TypeUtils.isEmptyStr(dir)) {
                    if (!glob.hasMagic(dir)) {
                        let parsedFile = Path.parse(dir);
                        let curPath = Path.join(parsedFile.dir, parsedFile.name);
                        let fullPath = Path.join(process.cwd(), TargetDir[i], curPath + '.*');
                        let IsInside = c4utils_1.PathUtils.PathInside(process.cwd(), fullPath);
                        if (IsInside) {
                            paths.push(fullPath);
                            return paths;
                        }
                    }
                }
            }, []);
            Models.push(...c4utils_1.FSP.getModules(LoadPaths, "", debug));
        }
        return Models;
    }
    return arg;
}
exports.getControllers = getControllers;
function needProcessMultiPart(consumes) {
    if (c4utils_1.TypeUtils.isArray(consumes)
        && consumes.length > 0
        && c4utils_1.TypeUtils.isString(consumes[0])) {
        for (let i = 0; i < consumes.length; i++) {
            if (consumes[i].toLowerCase() === 'multipart/form-data') {
                return true;
            }
        }
    }
    else if (c4utils_1.TypeUtils.isString(consumes)
        && consumes.toLocaleString() === 'multipart/form-data') {
        return true;
    }
    return false;
}
function processMultiPart(req, uploadPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let UploadDir = {};
        if (!c4utils_1.TypeUtils.isEmptyStr(uploadPath)) {
            UploadDir.uploadDir = uploadPath;
        }
        let Form = new MultiParty.Form(UploadDir);
        let FormData = yield new Promise((resolve, reject) => {
            Form.parse(req, (err, fields, files) => {
                if (err) {
                    return reject(err);
                }
                resolve({
                    fileds: fields,
                    files: files
                });
            });
        }).catch((err) => {
            throw err;
        });
        return FormData;
    });
}
function checkParamsOrHeaders(params, conditions, isQuery, logger) {
    let CurType = isQuery ? 'Params' : 'Headers';
    if (!c4utils_1.TypeUtils.isArray(params)
        || c4utils_1.TypeUtils.isEmptyArray(params)
        || !c4utils_1.TypeUtils.isString(params[0])) {
        if (logger)
            logger.debug('Check params : RequestMapping ' + CurType + ' is empty.');
        return true;
    }
    for (let i = 0; i < params.length; i++) {
        let CurParam = params[i];
        let KV = CurParam.replace(/\s/g, '').split('=');
        if (KV.length === 2) {
            // 限定了查询的值
            if (conditions[KV[0]] != KV[1]) {
                if (logger)
                    logger.debug('Check params : RequestMapping ' + CurType + ' <' + KV[0] + '> value unequal ' + KV[1] + '.');
                return false;
            }
        }
        if (KV.length === 1) {
            // 限定了查询参数名
            if (KV[0].slice(0, 1) === '!') {
                if (!c4utils_1.TypeUtils.isEmptyObj(conditions[KV[0].slice(1)])) {
                    if (logger)
                        logger.debug('Check params : RequestMapping ' + CurType + ' <' + KV[0] + '> should not exist.');
                    return false;
                }
            }
            else {
                if (c4utils_1.TypeUtils.isEmptyObj(conditions[KV[0]])) {
                    if (logger)
                        logger.debug('Check params : RequestMapping ' + CurType + ' <' + KV[0] + '> not exist.');
                    return false;
                }
            }
        }
        else {
            // 不支持，忽略
            if (logger)
                logger.debug('Check params : RequestMapping ' + CurType + ' unknown config : ' + CurParam);
        }
    }
    return true;
}
function getRequestParams(paramConfig, req) {
    if (c4utils_1.TypeUtils.isEmptyObj(paramConfig)) {
        return [];
    }
    let Params = [];
    // let CurParamConfig = paramConfig.reverse();     // 颠倒顺序
    for (let i = 0; i < paramConfig.length; i++) {
        let CurConfig = paramConfig[i];
        if (!c4utils_1.TypeUtils.isNullOrUndefined(req.query[CurConfig.value])
            || !c4utils_1.TypeUtils.isNullOrUndefined(req.body[CurConfig.value])) {
            //if (CurConfig.index > Params.length) {
            // 把参数放到指定的位置
            // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
            //     Params.push(undefined);
            // }
            // if (!TypeUtils.isNullOrUndefined(req.query[CurConfig.value])) {
            //     Params.push(req.query[CurConfig.value]);
            if (!c4utils_1.TypeUtils.isNullOrUndefined(req.query[CurConfig.value])) {
                Params[CurConfig.index] = req.query[CurConfig.value];
            }
            else {
                // Params.push(req.body[CurConfig.value]);
                Params[CurConfig.index] = req.body(CurConfig.value);
            }
            //}
        }
        else {
            // 参数没找到
            if (CurConfig.required) {
                // 该参数为必传
                if (!c4utils_1.TypeUtils.isNullOrUndefined(CurConfig.defaultValue)) {
                    // 该参数有默认值，使用默认值
                    // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
                    //     Params.push(undefined);
                    // }
                    // Params.push(CurConfig.defaultValue);
                    Params[CurConfig.index] = req.query[CurConfig.defaultValue];
                }
                else {
                    // 没有默认值，抛出错误
                    throw new Error("Need query param : " + CurConfig.value);
                }
            }
        }
    }
    return Params;
}
function getRequestBody(paramConfig /*{ index : number; value : string}[]*/, req) {
    if (c4utils_1.TypeUtils.isEmptyObj(paramConfig)) {
        return [];
    }
    let Params = [];
    // let CurParamConfig = paramConfig.reverse();
    // let CurParamConfig = paramConfig;
    for (let i = 0; i < paramConfig.length; i++) {
        let CurConfig = paramConfig[i];
        if (!c4utils_1.TypeUtils.isNullOrUndefined(req.body[CurConfig.value])) {
            // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
            //     Params.push(undefined);
            // }
            // Params.push(req.body[CurConfig.value]);
            Params[CurConfig.index] = req.body[CurConfig.value];
        }
        else {
            // 参数没找到
            if (CurConfig.required) {
                // 该参数为必传
                if (!c4utils_1.TypeUtils.isNullOrUndefined(CurConfig.defaultValue)) {
                    // 该参数有默认值，使用默认值
                    // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
                    //     Params.push(undefined);
                    // }
                    // Params.push(CurConfig.defaultValue);
                    Params[CurConfig.index] = req.body[CurConfig.defaultValue];
                }
                else {
                    // 没有默认值，抛出错误
                    throw new Error("Need body property : " + CurConfig.value);
                }
            }
            // throw new Error("Need body property : " + CurConfig.value);
        }
    }
    return Params;
}
function mergeBindParams(...args) {
    let ParamsCount = arguments.length;
    let MaxLen = 0;
    let Params = [];
    for (let i = 0; i < ParamsCount; i++) {
        if (arguments[i].length > MaxLen)
            MaxLen = arguments[i].length;
    }
    for (let i = 0; i < MaxLen; i++) {
        Params.push(undefined);
    }
    for (let i = 0; i < ParamsCount; i++) {
        for (let j = 0; j < arguments[i].length; j++) {
            if (arguments[i][j] !== undefined) {
                Params[j] = arguments[i][j];
            }
        }
    }
    return Params;
}
function resFormat(result, Produces, res) {
    if (Produces === 'text/plain') {
        res.set('Content-Type', Produces);
        res.end(JSON.stringify(result));
    }
    else if (Produces === 'text/html') {
        res.set('Content-Type', Produces);
        res.end('<p>' + JSON.stringify(result) + '</p>');
    }
    else if (Produces === 'text/xml'
        || Produces === 'application/xml') {
        let Builder = new XML2JS.Builder();
        let JSONXML = Builder.buildObject(result);
        res.set('Content-Type', Produces);
        res.end(JSONXML);
    }
    else if (Produces === 'application/json') {
        if (c4utils_1.TypeUtils.isObject(result)) {
            res.json({
                code: result.code || 600,
                msg: result.msg || 'Succeed.',
                data: result.data || result
            });
        }
        else {
            res.json({
                code: 600,
                msg: 'Succeed.',
                data: result
            });
        }
    }
    else {
        res.status(406).end("Not Acceptable.");
    }
}
function processHandlerResult(result, Produces, res) {
    /**TODO:
     * 增加对ACL的后置过滤的支持
     */
    if (c4utils_1.TypeUtils.isString(result)) {
        // redirect:/xxxxpath@code
        // location:/xxxxxpath
        // file:/path|filename
        // @complete@
        let RedirectOpReg = new RegExp('^(redirect|location):');
        let LocationOpReg = new RegExp('^location:');
        let FileOpReg = new RegExp('^file:');
        let RedirectCodeReg = new RegExp('@\\d+$', 'g');
        let FileNameReg = new RegExp('(\\|[^/][\\s\\S]+)$', 'g');
        let CompleteReg = new RegExp('^@complete@$');
        // 检查是否在handle中是否处理完毕（res已经调用）
        let IsComplete = CompleteReg.exec(result);
        if (null != IsComplete) {
            return;
        }
        // 处理重定向
        let IsRedirect = RedirectOpReg.exec(result);
        if (null !== IsRedirect) {
            let RedirectPath = result.replace(RedirectOpReg, '');
            let RedirectCode = '';
            let IsLocation = LocationOpReg.exec(result);
            let IsRedirectCode = RedirectCodeReg.exec(RedirectPath);
            if (null !== IsRedirectCode) {
                RedirectCode = IsRedirectCode[0];
                RedirectCode = parseInt(RedirectCode.replace('@', ''));
                RedirectPath = RedirectPath.replace(RedirectCodeReg, "");
            }
            if (IsLocation) {
                if (RedirectCode) {
                    res.statusCode = RedirectCode;
                    res.location(RedirectPath);
                    res.end();
                }
                else {
                    res.location(RedirectPath);
                    res.end();
                }
            }
            else {
                if (RedirectCode)
                    res.redirect(RedirectCode, RedirectPath);
                else
                    res.redirect(RedirectPath);
            }
            return;
        }
        // 处理文件下载
        let IsDownload = FileOpReg.exec(result);
        if (null !== IsDownload) {
            let DownloadPath = result.replace(FileOpReg, '');
            DownloadPath = DownloadPath.replace(FileNameReg, '');
            // let HasFileName  = result.exec(FileNameReg);
            let HasFileName = FileNameReg.exec(result);
            if (null !== HasFileName) {
                let FileName = HasFileName[0];
                FileName = FileName.replace('|', '');
                res.download(DownloadPath, FileName);
            }
            else {
                res.download(DownloadPath);
            }
            return;
        }
        resFormat(result, Produces, res);
    }
    else {
        resFormat(result, Produces, res);
    }
}
function defineControllers(controllers, staticPath, uploadPath, logger) {
    let ControllerDefine = {
        Routers: [],
        ACLConfig: [],
        ACLStaticConfig: []
    };
    let Routers = [];
    controllers.forEach(controller => {
        // 处理静态资源ACL
        let CurAclStaticOption = c4accesscontrol_1.getACLStaticMetaOption(controller);
        if (!c4utils_1.TypeUtils.isEmptyObj(CurAclStaticOption)) {
            let TempKeys = Object.keys(CurAclStaticOption);
            for (let i = 0; i < TempKeys.length; i++) {
                let TempOption = c4accesscontrol_1.processStaticACL(CurAclStaticOption[TempKeys[i]], logger);
                ControllerDefine.ACLStaticConfig.push(TempOption);
            }
        }
        // 尝试获取Controller的配置
        let CurCOptions = Controller_1.getControllerOptions(controller);
        if (CurCOptions.Options.length === 0) {
            return;
        }
        // 尝试获取ACL配置
        let CurAclOption = c4accesscontrol_1.getACLMetaOption(controller);
        let CurRouter = Express.Router();
        let CurMainPath = CurCOptions.MainPath || '';
        let CurOptions = CurCOptions.Options;
        let ParamsConfig = CurCOptions.Params;
        let BodyConfig = CurCOptions.Body;
        let CurSep = Path.sep;
        let CurSepReg;
        if (CurSep === '\\') {
            CurSepReg = new RegExp('(\\\\\\\\|\\\\)', 'g');
        }
        else {
            CurSepReg = new RegExp(CurSep, 'g');
        }
        CurMainPath = Path.normalize('/' + CurMainPath).replace(CurSepReg, '/');
        for (let i = 0; i < CurOptions.length; i++) {
            let CurOption = CurOptions[i];
            let CurPath = CurOption.Path;
            CurPath = Path.normalize('/' + CurPath).replace(CurSepReg, '/');
            // 加入权限列表
            let CurACLConfig = null;
            if (!c4utils_1.TypeUtils.isEmptyObj(CurAclOption)) {
                CurACLConfig = c4accesscontrol_1.processACL((CurAclOption[CurOption.Name]), CurPath, CurOption.Method, logger);
                if (null !== CurACLConfig) {
                    ControllerDefine.ACLConfig.push(CurACLConfig);
                }
            }
            let CurHandler = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
                // check headers
                if (!checkParamsOrHeaders(CurOption.Headers, req.headers, false, logger)) {
                    next();
                    return;
                }
                // check Params
                if (!checkParamsOrHeaders(CurOption.Params, req.query, true, logger)) {
                    next();
                    return;
                }
                let Params = [];
                // bind query param
                let BindParams = [];
                try {
                    if (ParamsConfig)
                        BindParams = getRequestParams(ParamsConfig[CurOption.Name], req);
                }
                catch (error) {
                    if (logger)
                        logger.debug(error);
                    next();
                    return;
                }
                // bind body param
                let BindBodyParams = [];
                try {
                    if (BodyConfig)
                        BindBodyParams = getRequestBody(BodyConfig[CurOption.Name], req);
                }
                catch (error) {
                    if (logger)
                        logger.debug(error);
                    next();
                    return;
                }
                // 优先使用body
                // if (BindBodyParams.length > 0) {
                //     Params = BindBodyParams;
                // } else if (BindParams.length > 0) {
                //     Params = BindParams;
                // }
                Params = mergeBindParams(BindParams, BindBodyParams);
                /**
                 * TODO: 处理Consumes ---》 request 的 content-type类型
                 */
                // check multipart
                if (needProcessMultiPart(CurOption.Consumes)) {
                    let FormData = yield processMultiPart(req, uploadPath).catch((err) => {
                        if (logger) {
                            logger.debug(err);
                        }
                        return;
                    });
                    if (logger) {
                        logger.debug("Multi part data : " + JSON.stringify(FormData));
                    }
                    req['formData'] = FormData;
                    // Params.push(FormData.fileds);
                    // Params.push(FormData.files);
                }
                // 最后添加logger、req和res
                Params.push(logger);
                Params.push(req);
                Params.push(res);
                let Result;
                try {
                    Result = yield CurOption.Handler(...Params);
                }
                catch (error) {
                    if (logger)
                        logger.err ? logger.err(error) : logger.error(error);
                    next();
                    return;
                }
                // 根据produces来选择返回的方式
                try {
                    processHandlerResult(Result, CurOption.Produces || 'application/json', res);
                }
                catch (error) {
                    if (logger)
                        logger.debug(error);
                    next();
                    return;
                }
            });
            // bind router path and handler
            if (CurOption.Method === "GET") {
                CurRouter.get(CurPath, CurHandler);
            }
            else if (CurOption.Method === "POST") {
                CurRouter.post(CurPath, CurHandler);
            }
            else if (CurOption.Method === "PUT") {
                CurRouter.put(CurPath, CurHandler);
            }
            else if (CurOption.Method === "PATCH") {
                CurRouter.patch(CurPath, CurHandler);
            }
            else if (CurOption.Method === "DELETE") {
                CurRouter.delete(CurPath, CurHandler);
            }
            else if (CurOption.Method === "ALL") {
                CurRouter.all(CurPath, CurHandler);
            }
            else {
                if (logger)
                    logger.warn("DefineControllers unknown method type : " + CurOption.Method);
            }
        }
        Routers.push({
            path: CurMainPath,
            router: CurRouter
        });
    });
    ControllerDefine.Routers = Routers;
    // return Routers;
    return ControllerDefine;
}
exports.defineControllers = defineControllers;
//# sourceMappingURL=ControllerUtils.js.map