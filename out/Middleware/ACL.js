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
const URL = require("url");
const c4utils_1 = require("c4utils");
function checkStaticResourceACL(acl, pathName, userID, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        let StaticResourceConfigs = acl.getStaticResourceConfigs();
        let MatchRes = null;
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
            if (c4utils_1.TypeUtils.isEmptyStr(userID)) {
                // 403
                return -1;
            }
            let CheckRes = yield acl.AccCtrlAuth(MatchRes.resource, userID, "read", undefined);
            if (CheckRes.pass === false) {
                return -1;
            }
            else {
                return 1;
            }
        }
        return 0;
    });
}
function ACL(acl, logger) {
    return function (request, response, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!acl.isEnabled()) {
                // 检查是否启用
                next();
                return;
            }
            let CurURL = URL.parse(request.originalUrl);
            let CurPath = CurURL.pathname;
            let CurMethod = request.method.toUpperCase();
            let CurAction = "";
            switch (CurMethod) {
                case "GET": {
                    CurAction = "read";
                    break;
                }
                case "POST": {
                    CurAction = "create";
                    break;
                }
                case "PUT":
                case "PATCH": {
                    CurAction = "update";
                    break;
                }
                case "DELETE": {
                    CurAction = "delete";
                    break;
                }
                default: {
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
            if (request.jwt) {
                CurUserID = request.jwt.payload.userID;
            }
            else if (request.session) {
                CurUserID = request.session.userID;
            }
            /**
             * GET Method才尝试匹配静态资源的ACL
             */
            if (CurMethod === "GET") {
                let CheckRes = yield checkStaticResourceACL(acl, CurPath || "", CurUserID, logger);
                if (CheckRes === -1) {
                    response.status(403);
                    response.json(JSON.stringify({
                        Code: 403,
                        Msg: '访问受限'
                    }));
                    return;
                }
                else if (CheckRes === 1) {
                    next();
                    return;
                }
            }
            let ResourceConfig = acl.getResourceConfig(CurPath);
            if (c4utils_1.TypeUtils.isEmptyObj(ResourceConfig)) { // 没有权限配置，直接进入后继的处理过程
                next();
                return;
            }
            if (c4utils_1.TypeUtils.isEmptyStr(CurUserID)) {
                // 403
                response.status(403);
                response.json(JSON.stringify({
                    Code: 403,
                    Msg: '访问受限'
                }));
                return;
            }
            let CurParamUser = CurUserID;
            if (!c4utils_1.TypeUtils.isEmptyObj(request.query)
                && !c4utils_1.TypeUtils.isEmptyStr(ResourceConfig.paramUser)) {
                CurParamUser = request.query[ResourceConfig.paramUser];
            }
            if (!c4utils_1.TypeUtils.isEmptyObj(request.body)
                && !c4utils_1.TypeUtils.isEmptyStr(ResourceConfig.bodyUser)) {
                CurParamUser = request.body[ResourceConfig.bodyUser];
            }
            if (c4utils_1.TypeUtils.isEmptyStr(CurParamUser)) {
                CurParamUser = "";
            }
            let CheckRes = yield acl.AccCtrlAuth(CurPath, CurUserID, CurAction, CurParamUser);
            if (CheckRes.pass === false) {
                response.status(403);
                response.json(JSON.stringify({
                    Code: 403,
                    Msg: '访问受限'
                }));
                return;
            }
            if (!c4utils_1.TypeUtils.isEmptyObj(request.query)
                && !c4utils_1.TypeUtils.isEmptyStr(ResourceConfig.paramUser)) {
                request.query[ResourceConfig.paramUser] = CheckRes.user;
            }
            if (!c4utils_1.TypeUtils.isEmptyObj(request.body)
                && !c4utils_1.TypeUtils.isEmptyStr(ResourceConfig.bodyUser)) {
                request.body[ResourceConfig.bodyUser] = CheckRes.user;
            }
            request.acl = {
                c4AccessControl: acl,
                aclRes: CheckRes
            };
            next();
        });
    };
}
exports.default = ACL;
//# sourceMappingURL=ACL.js.map