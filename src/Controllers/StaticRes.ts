import {
    ACL
} from 'c4accesscontrol'

export default class StaticRes {

    @ACL({
        resource    : "/private/(.*)",
        desc        : "私有资源",
        action      : {
            read : ["any"]
        },
        staticRes : true
    })
    static PrivateRes() {
        //
    }
}
