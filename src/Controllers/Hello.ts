import {
    RestController, RequestMapping,
    getRequest, getResponse, getSession,
    setSession, saveSession, regenerateSession,
    // Auth
} from '../Annotation/Controller';

// let TestAuth = Auth(async (session : any, ..._args : any[]) => {
//     if (session.test !== "123") {
//         await new Promise((resolve, reject) => {
//             setTimeout(() => {
//                 //
//                 resolve();
//             }, 2000)
//         });
//         return true;
//     } else {
//         return {
//             AuthRes : false,
//             Response : async function (...args : any[]) {
//                 let Res = getResponse(...args);
//                 Res.status(403)
//                 Res.json({
//                     code : 403,
//                     msg  : "Ha ha",
//                     data : {}
//                 });
//                 return '@complete@'
//             }
//         };
//     }
// });

@RestController('/test')
export default class Hello {

    @RequestMapping({
        Path    : '/hello',
        Method  : 'GET',
        Consumes : ["multipart/form-data"],
        Params : [ "user=123", "!pwd"]
    })
    static hello() {
        return 'hello'
    }

    @RequestMapping({
        Path    : '/world',
        Method  : 'POST',
        Consumes : ["multipart/form-data"],
        Params : ['user']
    })
    // @TestAuth
    static async world() {
        let req = getRequest(...arguments);
        console.log(JSON.stringify(req.session, null, 4));
        setSession('test', '123', ...arguments);
        saveSession(...arguments);
        if (getSession(...arguments).test) {
            regenerateSession(...arguments)
        }
        return {
            code : 601,
            msg  : "Hello world",
            data : {
                text : "world"
            }
        };
    }
}

