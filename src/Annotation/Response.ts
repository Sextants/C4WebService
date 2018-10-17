import 'reflect-metadata';
import { ResponseOptions } from './ControllerType';


const RESPONSE_OPTIONS_KEY  = "c4webservice:response_options";

/**
 * TODO: 为后面ACL的filter做准备
 */

/**
 * 登记用来作为Controller返回值的class
 * @param target 
 */
export function ResponseData(all : boolean) {
    return function (target : any) {
        let ResponseDataOptions : ResponseOptions = getResponseOptions(target);
        if (all) {
            let Temp    = new target();
            let Props   = Object.getOwnPropertyNames(Temp);
            ResponseDataOptions.Propertys = Props;
        }
    }
}

/**
 * 登记用来作为Controller返回值的class的属性
 * @param target 
 * @param propertyKey 
 */
export function ResponseProperty(target : any, propertyKey : string) {
    let ResponseDataOptions : ResponseOptions = getResponseOptions(target);
    ResponseDataOptions.Propertys.push(propertyKey);
}

export function getResponseOptions(target : any) {
    let ResponseDataOptions : ResponseOptions = Reflect.getMetadata(RESPONSE_OPTIONS_KEY, target);
    if (ResponseDataOptions === undefined) {
        ResponseDataOptions = {
            Propertys : []
        };
        Reflect.defineMetadata(RESPONSE_OPTIONS_KEY, ResponseDataOptions, target);
    }

    return ResponseDataOptions;
}
