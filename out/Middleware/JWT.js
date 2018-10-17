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
const c4utils_1 = require("c4utils");
function JWT(jwt, authField, logger) {
    return function (request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            let Headers = request.headers;
            request["jwt"] = {
                payload: {},
                jwt: jwt
            };
            if (c4utils_1.TypeUtils.isObject(Headers) && c4utils_1.TypeUtils.isString(Headers.authorization)) {
                let CurToken = Headers.authorization;
                let AuthField = authField ? authField : "Token";
                if (CurToken.substr(0, AuthField.length + 1) === AuthField + " ") {
                    // 存在AuthField 
                    let VerifyRes = {
                        verifyRes: false,
                        jwt: null
                    };
                    let tokenStr = CurToken.substr(AuthField.length + 1);
                    try {
                        VerifyRes = yield jwt.verifyJWT(tokenStr);
                    }
                    catch (error) {
                        if (logger) {
                            logger.err ? logger.err(error) : logger.error(error);
                        }
                    }
                    if (VerifyRes.verifyRes) {
                        request.jwt.payload = VerifyRes.verifyRes.pdata;
                        request.jwt["token"] = tokenStr;
                    }
                }
            }
            next();
        });
    };
}
exports.default = JWT;
// export  function JWT1(jwtOption : JwtOption, logger : any) : RequestHandler {
//     return function(request : Request, response : Response, next : NextFunction) : any {
//         let Headers = request.headers;
//         if (TypeUtils.isObject(Headers) && TypeUtils.isString((<any>Headers).authorization)) {
//             let CurToken : string   = (<any>Headers).authorization;
//             let AuthFeild : string  = jwtOption.authField ? jwtOption.authField : "Token";
//             if (CurToken.substr(0, AuthFeild.length + 1) === AuthFeild + " ") {
//                 let TokenDecoded = jwt.decode(CurToken.substr(AuthFeild.length + 1), { complete : true});
//                 if (TypeUtils.isEmptyObj(TokenDecoded)) {
//                     //
//                 }
//             } else {
//                 next();
//             }
//         } else {
//             (<any>request).jwt = {
//                 signJWT : function(audience ?: string, jwtId ?: string) {
//                     let CurKey      = "";
//                     let CurKeyId    = "";
//                     let CurKeys     = [];
//                     if (jwtOption.jwtKey) {
//                         if (TypeUtils.isObject(jwtOption.jwtKey)) {
//                             CurKeys = Object.keys(jwtOption.jwtKey);
//                         } else {
//                             for (let i = 0; i < (<string []>jwtOption.jwtKey).length; i++) {
//                                 CurKeys.push(i);
//                             }
//                         }
//                         let randomIndex = parseInt((Math.random() * CurKey.length) + "");
//                         CurKeyId    = CurKeys[randomIndex] + "";
//                         CurKey      = (<any>jwtOption.jwtKey)[CurKeyId];
//                     } else {
//                         CurKey      = "Default_Key";
//                     }
//                     let CurToken = jwt.sign(JSON.stringify(this), CurKey, {
//                         algorithm   : jwtOption.algorithm,
//                         expiresIn   : jwtOption.expiresIn,
//                         notBefore   : jwtOption.notBefore,
//                         audience    : audience,
//                         issuer      : jwtOption.issuer,
//                         jwtid       : jwtId,
//                         subject     : jwtOption.subject,
//                         keyid       : CurKeyId === "" ? undefined : CurKeyId
//                     });
//                     return (new Buffer(CurToken)).toString("base64");
//                 },
//                 setJWT : function(key : string, value : any) {
//                     this[key] = value;
//                 },
//                 cancel : function() {
//                     //
//                 }
//             }
//             next();
//         }
//         // if (TypeUtils.isObject(Headers) && TypeUtils.isString((<any>Headers).authorization)) {
//         //     let CurToken : string   = (<any>Headers).authorization;
//         //     let AuthFeild : string  = (<any>Headers).authFeild;
//         //     if (CurToken.substr(0, AuthFeild.length + 1) === AuthFeild + " ") {
//         //         jwt.verify(CurToken.substr(AuthFeild.length + 1), tokenKey, (err, decoded) => {
//         //             if (err) {
//         //                 if (logger) {
//         //                     logger.err ? logger.err(err) : logger.error(err);
//         //                 }
//         //                 next("JWT error.");
//         //                 return;
//         //             }
//         //             (<any>request).jwt = decoded;
//         //             next();
//         //         })
//         //     } else {
//         //         next();
//         //     }
//         // }
//     }
// }
//# sourceMappingURL=JWT.js.map