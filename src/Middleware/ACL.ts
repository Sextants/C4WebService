import { NextFunction, RequestHandler, Request, Response } from 'express';
import { C4AccessControl, ACResourceMatrix } from 'c4accesscontrol'
import URL = require('url');
import { TypeUtils } from 'c4utils';

async function checkStaticResourceACL(acl : C4AccessControl, pathName : string, userID : string, logger : any) {
    let StaticResourceConfigs = acl.getStaticResourceConfigs();
    let MatchRes : ACResourceMatrix | null = null;
    let ResourceKeys = Object.keys(StaticResourceConfigs);
    for (let i = 0; i < ResourceKeys.length; i++) {
        let CurStaticConfig = StaticResourceConfigs[ResourceKeys[i]];
        if (CurStaticConfig.staticPathReg) {
            let TempRes = CurStaticConfig.staticPathReg.exec(pathName || "");
            if (TempRes !== null) {
                MatchRes = CurStaticConfig;
                break;
            }
        }
    }
    if (null !== MatchRes) {
        if (TypeUtils.isEmptyStr(userID)) {
            // 403
            return -1;
        }
        let CheckRes = await acl.AccCtrlAuth(MatchRes.resource, userID, "read", undefined);
        if (CheckRes.pass === false) {
            return -1;
        } else {
            return 1;
        }
    }
    return 0;
}

export default function ACL(acl : C4AccessControl, logger : any) : RequestHandler {
    return async function(request : Request, response : Response, next : NextFunction) {
        if (!acl.isEnabled()) {
            // 检查是否启用
            next();
            return;
        }

        let CurURL      = URL.parse(request.originalUrl);
        let CurPath     = CurURL.pathname;
        let CurMethod   = request.method.toUpperCase();
        let CurAction   = "";
        switch (CurMethod) {
            case "GET" : {
                CurAction = "read";
                break;
            }
            case "POST": {
                CurAction = "create";
                break;
            }
            case "PUT" :
            case "PATCH" : {
                CurAction = "update";
                break;
            }
            case "DELETE" : {
                CurAction = "delete";
                break;
            }
            default : {
                if (logger)
                    logger.warn(`Check ${CurPath} ACL : Unknown mehtod type : ${CurMethod}.`);
                response.status(404);
                response.json(JSON.stringify({
                    Code: 404,
                    Msg: '未找到'
                }));
                return;
            }
        }

        // 获取当前访问者ID
        let CurUserID = "";
        if ((<any>request).jwt) {
            CurUserID = (<any>request).jwt.payload.userID;
        } else if (request.session) {
            CurUserID = request.session.userID;
        }

        /**
         * GET Method才尝试匹配静态资源的ACL
         */
        if (CurMethod === "GET") {
            let CheckRes = await checkStaticResourceACL(acl, CurPath || "", CurUserID, logger);
            if (CheckRes === -1) {
                response.status(403);
                response.json(JSON.stringify({
                    Code: 403,
                    Msg: '访问受限'
                }));
                return;
            } else if (CheckRes === 1) {
                next();
                return;
            }
        }

        let ResourceConfig = acl.getResourceConfig(<string>CurPath);
        if (TypeUtils.isEmptyObj(ResourceConfig)) {     // 没有权限配置，直接进入后继的处理过程
            next();
            return;
        }

        if (TypeUtils.isEmptyStr(CurUserID)) {
            // 403
            response.status(403);
            response.json(JSON.stringify({
                Code: 403,
                Msg: '访问受限'
            }));
            return;
        }

        let CurParamUser = CurUserID;
        if (!TypeUtils.isEmptyObj(request.query)
            && !TypeUtils.isEmptyStr(ResourceConfig.paramUser)) {
            CurParamUser = request.query[<string>ResourceConfig.paramUser];
        }
        if (!TypeUtils.isEmptyObj(request.body)
            && !TypeUtils.isEmptyStr(ResourceConfig.bodyUser)) {
            CurParamUser = request.body[<string>ResourceConfig.bodyUser];
        }

        if (TypeUtils.isEmptyStr(CurParamUser)) {
            CurParamUser = "";
        }

        let CheckRes = await acl.AccCtrlAuth(<string>CurPath, CurUserID, CurAction, CurParamUser);
        if (CheckRes.pass === false) {
            response.status(403);
            response.json(JSON.stringify({
                Code: 403,
                Msg: '访问受限'
            }));
            return;
        }

        if (!TypeUtils.isEmptyObj(request.query)
            && !TypeUtils.isEmptyStr(ResourceConfig.paramUser)) {
            request.query[<string>ResourceConfig.paramUser] = CheckRes.user;
        }
        if (!TypeUtils.isEmptyObj(request.body)
            && !TypeUtils.isEmptyStr(ResourceConfig.bodyUser)) {
            request.body[<string>ResourceConfig.bodyUser] = CheckRes.user;
        }

        (<any>request).acl = {
            c4AccessControl : acl,
            aclRes : CheckRes
        };
        next();
    }
}
