"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Express = require("express");
const BodyParser = require("body-parser");
const BodyParserXML = require("body-parser-xml");
const CookieParser = require("cookie-parser");
const Session = require("express-session");
const Compression = require("compression");
const CORS = require("cors");
// import RedisStore from 'connect-redis';
const Http = require("http");
const Https = require("https");
const c4accesscontrol_1 = require("c4accesscontrol");
const c4jwt_1 = require("c4jwt");
const c4utils_1 = require("c4utils");
const ControllerUtils_1 = require("./Annotation/ControllerUtils");
const ACL_1 = __importDefault(require("./Middleware/ACL"));
const JWT_1 = __importDefault(require("./Middleware/JWT"));
// body-parser
// compression (结果压缩)
// cookie-parser
// cookie-session
// cors (跨域支持)
// csurf (跨站攻击)
// multi-part 上传
class C4WebService {
    constructor() {
        this.m_Name = "";
        this.m_Type = "http";
        this.m_App = Express();
        this.m_bInit = false;
        this.m_DefaultBodyParser = null;
        this.m_StaticPath = "";
        this.m_UploadPath = "";
        this.m_Host = "";
        this.m_Port = 0;
        this.m_Domain = "";
        this.m_Logger = null;
        this.m_Http = null;
        this.m_CertConfig = null;
        // this.m_JWTOption            = {
        //     jwtKey      : [ "4OFGE6luXcTtnjLMcQn8JanoSl4i1yfb" ],
        //     authField   : "Token",
        //     algorithm   : "HS256",
        //     expiresIn   : "24h",
        //     issuer      : "DefaultIssuer",
        //     subject     : "DefaultSubject_Test"
        // };
        this.m_JWT = null;
        this.m_ACL = new c4accesscontrol_1.C4AccessControl();
    }
    /**
     * 初始化
     * @param config WebServiceConfig
     */
    init(config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.m_bInit)
                return;
            if (config.serviceType !== 'http'
                && config.serviceType !== 'https') {
                throw new Error("C4WebService type need http/https, but this service type is : " + config.serviceType);
            }
            if (config.serviceType === 'https') {
                if (c4utils_1.TypeUtils.isEmptyObj(config.certConfig)) {
                    throw new Error("C4WebService https need cert config.");
                }
                this.m_CertConfig = config.certConfig;
            }
            this.m_Type = config.serviceType;
            // 加入logger
            let Self = this;
            this.m_App.use(function (request, response, next) {
                request["logger"] = Self.m_Logger;
                next();
            });
            // 初始化ACL
            if (config.aclOption)
                this.m_ACL.init(config.aclOption);
            // 设置cookie parser
            if (config.cookie) {
                // check
                this.m_App.use(CookieParser(config.cookie.secret, config.cookie.options));
            }
            // 设置jwt
            if (config.jwtOption) {
                // check
                this.m_JWT = new c4jwt_1.C4JWT();
                yield this.m_JWT.init(config.jwtOption);
                // 增加jwt的解析中间件
                this.m_App.use(JWT_1.default(this.m_JWT, config.jwtOption.authField, this.m_Logger));
            }
            else {
                // 设置Session
                if (config.Session) {
                    // check
                    this.m_App.use(Session(config.Session));
                }
            }
            // 设置cors
            if (config.crosConfig) {
                // check
                if (config.allCros) {
                    this.m_App.use(CORS(config.crosConfig));
                }
                this.m_CORS = CORS(config.crosConfig);
            }
            // 设置Body解析大小
            let LimitSize = config.maxBodySize || '100kb';
            // 设置Body parser
            BodyParserXML(BodyParser);
            this.m_App.use(BodyParser.raw({ limit: LimitSize }));
            this.m_App.use(BodyParser.urlencoded({ limit: LimitSize, extended: true }));
            this.m_App.use(BodyParser.text({ limit: LimitSize }));
            this.m_App.use(BodyParser.json({ limit: LimitSize }));
            this.m_App.use(BodyParser.xml());
            // 设置检查ACL中间件
            if (this.m_ACL.isEnabled())
                this.m_App.use(ACL_1.default(this.m_ACL, this.m_Logger));
            // 设置static path
            if (c4utils_1.TypeUtils.isString(config.staticPath)
                && !c4utils_1.TypeUtils.isEmptyStr(config.staticPath)) {
                let AbsoluteStaticPath = yield c4utils_1.PathUtils.GetAbsolutePath(config.staticPath);
                let isInside = yield c4utils_1.PathUtils.PathInside(process.cwd(), AbsoluteStaticPath);
                if (!isInside) {
                    throw new Error("C4WebService static path not in process cwd dir.");
                }
                this.m_App.use(Express.static(AbsoluteStaticPath));
                this.m_StaticPath = AbsoluteStaticPath;
            }
            // 设置upload path
            if (c4utils_1.TypeUtils.isString(config.uploadPath)
                && !c4utils_1.TypeUtils.isEmptyStr(config.uploadPath)) {
                let AbsoluteStaticPath = yield c4utils_1.PathUtils.GetAbsolutePath(config.uploadPath);
                let isInside = yield c4utils_1.PathUtils.PathInside(process.cwd(), AbsoluteStaticPath);
                if (!isInside) {
                    throw new Error("C4WebService upload path not in process cwd dir.");
                }
                if (this.m_StaticPath !== AbsoluteStaticPath) {
                    this.m_App.use(Express.static(AbsoluteStaticPath));
                }
                this.m_UploadPath = AbsoluteStaticPath;
            }
            // 设置compression
            if (config.compression) {
                // check
                this.m_App.use(Compression(config.compression));
            }
            this.m_Name = config.name;
            this.m_Host = config.host;
            this.m_Port = config.port;
            this.m_Domain = config.domain || this.m_Host;
            if (config.logger) {
                this.m_Logger = config.logger;
            }
            this.m_bInit = true;
            // 设置Body解析
            // 设置static目录
            // 注册Controller
        });
    }
    /**
     * 获取Express对象
     */
    getApp() {
        return this.m_App;
    }
    /**
     * 启动
     */
    launch() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.m_bInit)
                return;
            // 设置404
            this.m_App.use((req, res) => {
                res.status(404);
                res.json(JSON.stringify({
                    Code: 404,
                    Msg: '未找到'
                }));
            });
            // 设置500
            this.m_App.use((err, req, res, next) => {
                res.status(500);
                res.json(JSON.stringify({
                    Code: 500,
                    Msg: '未知错误'
                }));
            });
            try {
                // 启动ACL，同步Role信息
                if (this.m_ACL.isEnabled() && this.m_ACL.isInit()) {
                    yield this.m_ACL.launch();
                }
            }
            catch (error) {
                if (this.m_Logger) {
                    this.m_Logger.err ? this.m_Logger.err("C4WebService launch ACL failed, " + error) : this.m_Logger.error("C4WebService launch ACL failed, " + error);
                }
                else {
                    console.error("C4WebService launch ACL failed, " + error);
                }
                throw error;
            }
            // 启动
            let Self = this;
            yield new Promise((resolve, reject) => {
                if (Self.m_Type === "http") {
                    Self.m_Http = Http.createServer(Self.m_App).listen(Self.m_Port, Self.m_Host, () => {
                        if (Self.m_Logger) {
                            Self.m_Logger.info(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                        }
                        else {
                            console.log(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                        }
                        resolve();
                    });
                }
                else if (Self.m_Type === "https") {
                    if (c4utils_1.TypeUtils.isEmptyObj(Self.m_CertConfig)) {
                        throw new Error("C4WebService https need cert config.");
                    }
                    Self.m_Http = Https.createServer(Self.m_CertConfig, Self.m_App).listen(Self.m_Port, Self.m_Host, () => {
                        if (Self.m_Logger) {
                            Self.m_Logger.info(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                        }
                        else {
                            console.log(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                        }
                        resolve();
                    });
                }
                else {
                    throw new Error("C4WebService type need http/https, but this service type is : " + Self.m_Type);
                }
            }).catch((err) => {
                throw err;
            });
        });
    }
    /**
     * 停止
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.m_bInit
                || this.m_Http === null)
                return;
            let Self = this;
            yield new Promise((resolve, reject) => {
                Self.m_Http.close(() => {
                    this.m_Http = null;
                    resolve();
                });
            });
        });
    }
    /**
     * 重启
     */
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.m_bInit)
                return;
            yield this.stop();
            yield this.m_ACL.reset();
            this.m_bInit = false;
        });
    }
    addControllers(arg) {
        return __awaiter(this, void 0, void 0, function* () {
            const controllers = ControllerUtils_1.getControllers(arg);
            // console.log(controllers)
            // let Routers = defineControllers(controllers, this.m_StaticPath, this.m_UploadPath, this.m_Logger);
            // for (let i = 0; i < Routers.length; i++) {
            //     if (Routers[i].path !== ""
            //         && Routers[i].path !== "/") {
            //         this.m_App.use(Routers[i].path, Routers[i].router);
            //     } else {
            //         this.m_App.use(Routers[i].router);
            //     }
            // }
            let ControllerDefine = ControllerUtils_1.defineControllers(controllers, this.m_StaticPath, this.m_UploadPath, this.m_Logger);
            for (let i = 0; i < ControllerDefine.Routers.length; i++) {
                if (ControllerDefine.Routers[i].path !== ""
                    && ControllerDefine.Routers[i].path !== "/") {
                    this.m_App.use(ControllerDefine.Routers[i].path, ControllerDefine.Routers[i].router);
                }
                else {
                    this.m_App.use(ControllerDefine.Routers[i].router);
                }
            }
            if (this.m_ACL.isEnabled()) {
                // 添加Controller的资源矩阵配置
                for (let i = 0; i < ControllerDefine.ACLConfig.length; i++) {
                    this.m_ACL.addAccCtrlTarget(ControllerDefine.ACLConfig[i]);
                }
                // 添加静态资源的资源矩阵配置
                for (let i = 0; i < ControllerDefine.ACLStaticConfig.length; i++) {
                    this.m_ACL.addAccCtrlTarget(ControllerDefine.ACLStaticConfig[i]);
                }
                // 上传资源矩阵
                yield this.m_ACL.updateAclMatrix();
            }
        });
    }
}
exports.default = C4WebService;
//# sourceMappingURL=C4WebService.js.map