import {
    RestController, RequestMapping,
    RequestBody, RequestParam, generateJWT, revokeJWT, refreshJWT
} from '../Annotation/Controller';

import {
    ACL
} from 'c4accesscontrol'

@RestController('/tryacl')
export default class TryACL {

    @RequestMapping({
        Path    : "/login",
        Method  : "POST",
        Consumes: ["application/json"],
        Params  : ["user", "pwd"]
    })
    static async login(
        @RequestParam({
            value   : "user",
            required: true
        }) user : string,
        @RequestParam({
            value   : "pwd",
            required: true
        }) pwd : string
    ) {
        let Res = {
            code : 600,
            msg  : "登录成功",
            data : {}
        };
        if (user !== "admin"
            || pwd !== "admin123") {
            Res.code    = 601;
            Res.msg     = "登录失败";
        } else {
            let Token = await generateJWT("user", ...arguments);
            (<any>Res.data)["token"] = Token;
        }

        return Res;
    }

    @RequestMapping({
        Path    : "/logout",
        Method  : "POST",
        Consumes: ["application/json"]
    })
    static async logout() {
        let Res = {
            code : 600,
            msg  : "登出成功",
            dtaa : {}
        };
        // 撤销JWT
        let RevokeRes = await revokeJWT(...arguments);
        if (RevokeRes === false) {
            Res.code = 601;
            Res.msg  = "登出失败"
        }

        return Res;
    }

    @RequestMapping({
        Path    : "/refreshToken",
        Method  : "PUT",
        Consumes: ["application/json"]
    })
    static async refreshToken() {
        let Res = {
            code : 600,
            msg  : "刷新成功",
            data : {}
        };

        let Token = "";
        try {
            Token = await refreshJWT(...arguments);
            (<any>Res.data).token = Token;
        } catch (error) {
            Res.code = 601;
            Res.msg  = "刷新失败"
        }

        return Res;
    }

    @RequestMapping({
        Path    : "/getData01",
        Method  : "GET",
        Consumes: ["application/json"]
    })
    @ACL({
        resource    : "getData01",
        desc        : "获取测试数据",
        action      : {
            read : ["own"]
        },
        paramUser : "user"
    })
    static async getData01(
        @RequestParam({
            value   : "user",
            required: true
        }) userID : string
    ) {
        return {
            code : 600,
            msg  : "Succeed",
            data : {
                msg : `当前请求用户：${userID}.`
            }
        };
    }

    @RequestMapping({
        Path    : "/getData02",
        Method  : "POST",
        Consumes: ["application/json"]
    })
    @ACL({
        resource    : "getData02",
        desc        : "提交测试数据",
        action      : {
            create : ["own", "any"]
        },
        bodyUser : "user"
    })
    static async getData02(
        @RequestBody({
            value : "user"
        }) userID : string,
        @RequestBody({
            value : "tempData"
        }) tempData : string
    ) {
        return {
            code : 600,
            msg  : "Succeed",
            data : {
                msg : `用户${userID}提交的数据为：${tempData}.`
            }
        }
    }
};
