import { NextFunction, RequestHandler, Request, Response } from 'express';
import { TypeUtils } from 'c4utils';
import jwt = require('jsonwebtoken');
import { JWTConfig, C4JWT } from 'c4jwt';

export default function JWT(jwt : C4JWT, authField : string, logger : any) : RequestHandler {
    return async function(request : Request, response : Response, next : NextFunction) {
        let Headers = request.headers;
        (<any>request)["jwt"] = {
            payload : {},
            jwt : jwt
        };
        if (TypeUtils.isObject(Headers) && TypeUtils.isString((<any>Headers).authorization)) {
            let CurToken : string   = (<any>Headers).authorization;
            let AuthField : string  = authField ? authField : "Token";
            if (CurToken.substr(0, AuthField.length + 1) === AuthField + " ") {
                // 存在AuthField 
                let VerifyRes : {
                    verifyRes : boolean,
                    jwt : {} | any
                } = {
                    verifyRes : false,
                    jwt : null
                };
                let tokenStr = CurToken.substr(AuthField.length + 1);
                try {
                    VerifyRes = await jwt.verifyJWT(tokenStr);
                } catch (error) {
                    if (logger) {
                        logger.err ? logger.err(error) : logger.error(error);
                    }
                }
                if (VerifyRes.verifyRes) {
                    (<any>request).jwt.payload  = (<any>VerifyRes.verifyRes).pdata;
                    (<any>request).jwt["token"] = tokenStr;
                }
            }
        }
        next();
    }
}

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
