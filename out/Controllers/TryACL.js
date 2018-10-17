"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Controller_1 = require("../Annotation/Controller");
const c4accesscontrol_1 = require("c4accesscontrol");
let TryACL = class TryACL {
    static login(user, pwd) {
        return __awaiter(this, arguments, void 0, function* () {
            let Res = {
                code: 600,
                msg: "登录成功",
                data: {}
            };
            if (user !== "admin"
                || pwd !== "admin123") {
                Res.code = 601;
                Res.msg = "登录失败";
            }
            else {
                let Token = yield Controller_1.generateJWT("user", ...arguments);
                Res.data["token"] = Token;
            }
            return Res;
        });
    }
    static logout() {
        return __awaiter(this, arguments, void 0, function* () {
            let Res = {
                code: 600,
                msg: "登出成功",
                dtaa: {}
            };
            // 撤销JWT
            let RevokeRes = yield Controller_1.revokeJWT(...arguments);
            if (RevokeRes === false) {
                Res.code = 601;
                Res.msg = "登出失败";
            }
            return Res;
        });
    }
    static refreshToken() {
        return __awaiter(this, arguments, void 0, function* () {
            let Res = {
                code: 600,
                msg: "刷新成功",
                data: {}
            };
            let Token = "";
            try {
                Token = yield Controller_1.refreshJWT(...arguments);
                Res.data.token = Token;
            }
            catch (error) {
                Res.code = 601;
                Res.msg = "刷新失败";
            }
            return Res;
        });
    }
    static getData01(userID) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                code: 600,
                msg: "Succeed",
                data: {
                    msg: `当前请求用户：${userID}.`
                }
            };
        });
    }
    static getData02(userID, tempData) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                code: 600,
                msg: "Succeed",
                data: {
                    msg: `用户${userID}提交的数据为：${tempData}.`
                }
            };
        });
    }
};
__decorate([
    Controller_1.RequestMapping({
        Path: "/login",
        Method: "POST",
        Consumes: ["application/json"],
        Params: ["user", "pwd"]
    }),
    __param(0, Controller_1.RequestParam({
        value: "user",
        required: true
    })),
    __param(1, Controller_1.RequestParam({
        value: "pwd",
        required: true
    }))
], TryACL, "login", null);
__decorate([
    Controller_1.RequestMapping({
        Path: "/logout",
        Method: "POST",
        Consumes: ["application/json"]
    })
], TryACL, "logout", null);
__decorate([
    Controller_1.RequestMapping({
        Path: "/refreshToken",
        Method: "PUT",
        Consumes: ["application/json"]
    })
], TryACL, "refreshToken", null);
__decorate([
    Controller_1.RequestMapping({
        Path: "/getData01",
        Method: "GET",
        Consumes: ["application/json"]
    }),
    c4accesscontrol_1.ACL({
        resource: "getData01",
        desc: "获取测试数据",
        action: {
            read: ["own"]
        },
        paramUser: "user"
    }),
    __param(0, Controller_1.RequestParam({
        value: "user",
        required: true
    }))
], TryACL, "getData01", null);
__decorate([
    Controller_1.RequestMapping({
        Path: "/getData02",
        Method: "POST",
        Consumes: ["application/json"]
    }),
    c4accesscontrol_1.ACL({
        resource: "getData02",
        desc: "提交测试数据",
        action: {
            create: ["own", "any"]
        },
        bodyUser: "user"
    }),
    __param(0, Controller_1.RequestBody({
        value: "user"
    })),
    __param(1, Controller_1.RequestBody({
        value: "tempData"
    }))
], TryACL, "getData02", null);
TryACL = __decorate([
    Controller_1.RestController('/tryacl')
], TryACL);
exports.default = TryACL;
;
//# sourceMappingURL=TryACL.js.map