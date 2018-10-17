import 'reflect-metadata';
import { ControllerConfig, ControllerOptions } from './ControllerType';
/**
 *
 * @param path 路由的主路径，若为空字符串，则忽略
 * @type string
 */
export declare function RestController(path?: string): (target: Function) => void;
/**
 *
 * @param config controller级别的配置
 * @type ControllerConfig
 */
export declare function RequestMapping(config: ControllerConfig): (target: any, key: string, descriptor: any) => void;
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
export declare function RequestParam(options?: {
    value: string;
    required?: boolean;
    defaultValue?: any;
}): (target: any, key: string, index: number) => void;
/**
 *
 * @param options body配置
 * @type
 * {
 *  value : string
 * }
 */
export declare function RequestBody(options: {
    value: string;
    required?: boolean;
    defaultValue?: any;
}): (target: any, key: string, index: number) => void;
export declare function getControllerOptions(target: any): ControllerOptions;
export declare function getRequest(...args: any[]): any;
export declare function getResponse(...args: any[]): any;
export declare function getSession(...args: any[]): any;
export declare function setSession(name: string, sessionData: any, ...args: any[]): void;
export declare function saveSession(...args: any[]): Promise<void>;
export declare function regenerateSession(...args: any[]): Promise<void>;
export declare function getJWT(...args: any[]): any;
/**
 * 对JWT的payload进行加密处理
 */
export declare function setJWT(name: string, jwtData: any, ...args: any[]): void;
export declare function generateJWT(audience: string, ...args: any[]): Promise<any>;
/**
 * 刷新JWT
 * @param args
 * 会抛异常
 */
export declare function refreshJWT(...args: any[]): Promise<any>;
/**
 * 撤销JWT
 * @param args
 * 会抛异常
 */
export declare function revokeJWT(...args: any[]): Promise<any>;
export declare function getACL(...args: any[]): any;
export declare function getMultipart(...args: any[]): any;
export declare function getLogger(...args: any[]): any;
