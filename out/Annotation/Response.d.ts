import 'reflect-metadata';
import { ResponseOptions } from './ControllerType';
/**
 * TODO: 为后面ACL的filter做准备
 */
/**
 * 登记用来作为Controller返回值的class
 * @param target
 */
export declare function ResponseData(all: boolean): (target: any) => void;
/**
 * 登记用来作为Controller返回值的class的属性
 * @param target
 * @param propertyKey
 */
export declare function ResponseProperty(target: any, propertyKey: string): void;
export declare function getResponseOptions(target: any): ResponseOptions;
