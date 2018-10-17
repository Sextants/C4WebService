"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
let Hello = class Hello {
    static hello() {
        return 'hello';
    }
    // @TestAuth
    static world() {
        return __awaiter(this, arguments, void 0, function* () {
            let req = Controller_1.getRequest(...arguments);
            console.log(JSON.stringify(req.session, null, 4));
            Controller_1.setSession('test', '123', ...arguments);
            Controller_1.saveSession(...arguments);
            if (Controller_1.getSession(...arguments).test) {
                Controller_1.regenerateSession(...arguments);
            }
            return {
                code: 601,
                msg: "Hello world",
                data: {
                    text: "world"
                }
            };
        });
    }
};
__decorate([
    Controller_1.RequestMapping({
        Path: '/hello',
        Method: 'GET',
        Consumes: ["multipart/form-data"],
        Params: ["user=123", "!pwd"]
    })
], Hello, "hello", null);
__decorate([
    Controller_1.RequestMapping({
        Path: '/world',
        Method: 'POST',
        Consumes: ["multipart/form-data"],
        Params: ['user']
    })
], Hello, "world", null);
Hello = __decorate([
    Controller_1.RestController('/test')
], Hello);
exports.default = Hello;
//# sourceMappingURL=Hello.js.map