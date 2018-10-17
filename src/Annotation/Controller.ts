import 'reflect-metadata';

import Path         = require('path');
import { TypeUtils } from 'c4utils';
import { ParamConfig, ControllerConfig, ControllerOption, ControllerOptions } from './ControllerType';
import { C4JWT } from 'c4jwt';

const CONTROLLER_OPTIONS_KEY    = "c4webservice:controller_options";

/**
 * 
 * @param path 路由的主路径，若为空字符串，则忽略
 * @type string 
 */
export function RestController(path ?: string) {
    return function (target : Function) {
        let ControllerOptions : ControllerOptions = getControllerOptions(target);
        ControllerOptions.MainPath = path || '';

        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    }
}

/**
 * 
 * @param config controller级别的配置
 * @type ControllerConfig
 */
export function RequestMapping(config : ControllerConfig) {
    return function (target : any, key : string, descriptor : any) {
        let ControllerOptions : ControllerOptions = getControllerOptions(target);
        let CurOptions : ControllerOption = Object.assign({
            Name : key
        }, config);
        CurOptions.Handler = descriptor.value;

        ControllerOptions.Options.push(CurOptions);
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    }
}

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
export function RequestParam(options ?: {
    value  : string,
    required ?: boolean,
    defaultValue ?: any
}) {
    return function (target : any, key : string, index : number) {
        let ControllerOptions : ControllerOptions = getControllerOptions(target);
        let CurOptions : ParamConfig = Object.assign({
            index : index
        }, options);
        if (TypeUtils.isEmptyObj(CurOptions.value)) {
            CurOptions.value = key;
        }
        if (TypeUtils.isEmptyObj(CurOptions.required)) {
            CurOptions.required = false;
        }
        if (ControllerOptions.Params === undefined) {
            ControllerOptions.Params = {};
        }
        if (TypeUtils.isEmptyObj(ControllerOptions.Params[key])) {
            ControllerOptions.Params[key] = [];
        }
        ControllerOptions.Params[key].push(CurOptions);
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    }
}

/**
 * 
 * @param options body配置
 * @type
 * {
 *  value : string
 * }
 */
export function RequestBody(options : {
    value : string,
    required ?: boolean,
    defaultValue ?: any
}) {
    return function(target : any, key : string, index : number) {
        let ControllerOptions : ControllerOptions = getControllerOptions(target);
        let CurOptions : ParamConfig = Object.assign({
            index : index
        }, options);

        if (TypeUtils.isEmptyObj(CurOptions.value)) {
            CurOptions.value = key;
        }

        if (TypeUtils.isEmptyObj(CurOptions.required)) {
            CurOptions.required = false;
        }

        if (ControllerOptions.Body === undefined) {
            ControllerOptions.Body = {};
        }
        if (TypeUtils.isEmptyObj(ControllerOptions.Body[key])) {
            ControllerOptions.Body[key] = [];
        }
        // ControllerOptions.Body[key].push({
        //     index : index,
        //     value : options.value
        // });
        ControllerOptions.Body[key].push(CurOptions);
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    }
}

export function getControllerOptions(target : any) {
    let ControllerOptions : ControllerOptions = Reflect.getMetadata(CONTROLLER_OPTIONS_KEY, target);
    if (ControllerOptions === undefined) {
        ControllerOptions = {
            MainPath : "",
            Options  : []
        };
        Reflect.defineMetadata(CONTROLLER_OPTIONS_KEY, ControllerOptions, target);
    }
    return ControllerOptions;
}

export function getRequest(...args : any[]) {
    return arguments[arguments.length - 2];
}

export function getResponse(...args : any[]) {
    return arguments[arguments.length - 1];
}

export function getSession(...args : any[]) {
    return getRequest(...arguments).session;
}

export function setSession(name : string, sessionData : any, ...args : any[]) {
    let req = getRequest(...args);
    if (TypeUtils.isEmptyObj(req.session)) {
        console.warn('[C4WebService] not init Session, but call setSession.');
        return;           // 没有定义Session选项
    }
    req.session[name] = sessionData;
}

export async function saveSession(...args : any[]) {
    let Session = getSession(...arguments);
    if (Session) {
        await new Promise((resolve, reject) => {
            Session.save((err : any) => {
                if (err) {
                    reject(err);
                }
                resolve();
            });
        });
    }
}

export async function regenerateSession(...args : any[]) {
    let Session = getSession(...arguments);
    if (Session) {
        await new Promise((resolve, reject) => {
            Session.regenerate((err : any) => {
                if (err) {
                    reject (err);
                }
                resolve();
            });
        });
    }
}

export function getJWT(...args : any[]) {
    return getRequest(...arguments).jwt;
}

/**
 * 对JWT的payload进行加密处理
 */
export function setJWT(name : string, jwtData : any, ...args : any[]) {
    let jwt = getJWT(...args);
    jwt.payload = (<C4JWT>jwt.jwt).setJWT(jwt.payload, name, jwtData);
}

// 创建JWT
export async function generateJWT(audience : string, ...args : any[]) {
    let jwt = getJWT(...args);
    let Token = await jwt.jwt.generateJWT(audience, jwt.payload);
    jwt.token = Token;
    return Token;
}

/**
 * 刷新JWT
 * @param args 
 * 会抛异常
 */
export async function refreshJWT(...args : any[]) {
    let jwt = getJWT(...args);
    if (TypeUtils.isEmptyStr(jwt.token)) {
        return false;
    }

    let Token = await jwt.jwt.refreshJWT(jwt.token);
    jwt.token = Token;
    return Token;
}

/**
 * 撤销JWT
 * @param args 
 * 会抛异常
 */
export async function revokeJWT(...args : any[]) {
    let jwt = getJWT(...args);
    if (TypeUtils.isEmptyStr(jwt.token)) {
        return false;
    }

    let Res = await jwt.jwt.revokeJWT(jwt.token);
    return Res;
}

// 获取Auth信息
export function getACL(...args : any[]) {
    return getRequest(...arguments).acl;
}

// 获取multiPart
export function getMultipart(...args : any[]) {
    return getRequest(...arguments).formData;
}

// 获取logger
export function getLogger(...args : any[]) {
    return getRequest(...args).logger;
}
