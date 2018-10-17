"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const RESPONSE_OPTIONS_KEY = "c4webservice:response_options";
/**
 * TODO: 为后面ACL的filter做准备
 */
/**
 * 登记用来作为Controller返回值的class
 * @param target
 */
function ResponseData(all) {
    return function (target) {
        let ResponseDataOptions = getResponseOptions(target);
        if (all) {
            let Temp = new target();
            let Props = Object.getOwnPropertyNames(Temp);
            ResponseDataOptions.Propertys = Props;
        }
    };
}
exports.ResponseData = ResponseData;
/**
 * 登记用来作为Controller返回值的class的属性
 * @param target
 * @param propertyKey
 */
function ResponseProperty(target, propertyKey) {
    let ResponseDataOptions = getResponseOptions(target);
    ResponseDataOptions.Propertys.push(propertyKey);
}
exports.ResponseProperty = ResponseProperty;
function getResponseOptions(target) {
    let ResponseDataOptions = Reflect.getMetadata(RESPONSE_OPTIONS_KEY, target);
    if (ResponseDataOptions === undefined) {
        ResponseDataOptions = {
            Propertys: []
        };
        Reflect.defineMetadata(RESPONSE_OPTIONS_KEY, ResponseDataOptions, target);
    }
    return ResponseDataOptions;
}
exports.getResponseOptions = getResponseOptions;
//# sourceMappingURL=Response.js.map