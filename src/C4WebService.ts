

import Express      = require('express');
import BodyParser   = require('body-parser');
import BodyParserXML= require('body-parser-xml');
import CookieParser = require('cookie-parser');
import Session      = require('express-session');
import Compression  = require('compression');
import CORS         = require('cors');
import RedisStore   = require('connect-redis');
// import RedisStore from 'connect-redis';
import Http         = require('http');
import Https        = require('https');
import { C4AccessControl } from 'c4accesscontrol';
import { C4JWT } from 'c4jwt';
import { PathUtils, TypeUtils } from 'c4utils';
import { defineControllers, getControllers } from './Annotation/ControllerUtils';
import ACL from './Middleware/ACL';
import JWT from './Middleware/JWT';
import { CertConfig, WebServiceConfig, WebServiceType } from './WebServiceTypes/WebServiceConfig';
import Path = require('path');

// body-parser
// compression (结果压缩)
// cookie-parser
// cookie-session
// cors (跨域支持)
// csurf (跨站攻击)
// multi-part 上传


export default class C4WebService {

    private m_Name                  : string;
    private m_Type                  : WebServiceType;
    private m_App                   : Express.Express;
    private m_bInit                 : boolean;
    private m_DefaultBodyParser     : any;
    private m_StaticPath            : string;
    private m_UploadPath            : string;
    private m_CORS                  : any;
    private m_Host                  : string;
    private m_Port                  : number;
    private m_Domain                : string;
    private m_Logger                : any | null;
    private m_Http                  : Http.Server | Https.Server | null;
    private m_CertConfig            : CertConfig | null;
    private m_JWT                   : C4JWT | null;
    // private m_JWTOption             : JwtOption;
    private m_ACL                   : C4AccessControl;

    constructor() {
        this.m_Name                 = "";
        this.m_Type                 = "http";
        this.m_App                  = Express();
        this.m_bInit                = false;
        this.m_DefaultBodyParser    = null;
        this.m_StaticPath           = "";
        this.m_UploadPath           = "";
        this.m_Host                 = "";
        this.m_Port                 = 0;
        this.m_Domain               = "";
        this.m_Logger               = null;
        this.m_Http                 = null;
        this.m_CertConfig           = null;
        // this.m_JWTOption            = {
        //     jwtKey      : [ "4OFGE6luXcTtnjLMcQn8JanoSl4i1yfb" ],
        //     authField   : "Token",
        //     algorithm   : "HS256",
        //     expiresIn   : "24h",
        //     issuer      : "DefaultIssuer",
        //     subject     : "DefaultSubject_Test"
        // };
        this.m_JWT                  = null;
        this.m_ACL                  = new C4AccessControl();
    }

    /**
     * 初始化
     * @param config WebServiceConfig
     */
    async init(config : WebServiceConfig) {
        if (this.m_bInit)
            return;

        if (config.serviceType !== 'http'
            && config.serviceType !== 'https') {
            throw new Error("C4WebService type need http/https, but this service type is : " + config.serviceType);
        }
        if (config.serviceType === 'https') {
            if (TypeUtils.isEmptyObj(config.certConfig)) {
                throw new Error("C4WebService https need cert config.");
            }
            this.m_CertConfig = <CertConfig>config.certConfig;
        }
        this.m_Type = config.serviceType;

        // 加入logger
        let Self = this;
        this.m_App.use(function (request, response, next) {
            (<any>request)["logger"] = Self.m_Logger;
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
        if(config.jwtOption){
            // check
            this.m_JWT  = new C4JWT();
            await this.m_JWT.init(config.jwtOption);
            // 增加jwt的解析中间件
            this.m_App.use(JWT(this.m_JWT, config.jwtOption.authField, this.m_Logger));
        } else {
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
        this.m_App.use(BodyParser.raw({ limit : LimitSize}));
        this.m_App.use(BodyParser.urlencoded({ limit : LimitSize, extended: true}));
        this.m_App.use(BodyParser.text({ limit : LimitSize}));
        this.m_App.use(BodyParser.json({ limit : LimitSize}));
        this.m_App.use((<any>BodyParser).xml());

        // 设置检查ACL中间件
        if (this.m_ACL.isEnabled())
            this.m_App.use(ACL(this.m_ACL, this.m_Logger));

        // 设置static path
        if (TypeUtils.isString(config.staticPath)
            && !TypeUtils.isEmptyStr(config.staticPath)) {
            let AbsoluteStaticPath  = await PathUtils.GetAbsolutePath(<string>config.staticPath);
            let isInside            = await PathUtils.PathInside(process.cwd(), AbsoluteStaticPath);
            if (!isInside) {
                throw new Error("C4WebService static path not in process cwd dir.");
            }
            this.m_App.use(Express.static(AbsoluteStaticPath));
            this.m_StaticPath = AbsoluteStaticPath;
        }

        // 设置upload path
        if (TypeUtils.isString(config.uploadPath)
            && !TypeUtils.isEmptyStr(config.uploadPath)) {
            let AbsoluteStaticPath  = await PathUtils.GetAbsolutePath(<string>config.uploadPath);
            let isInside            = await PathUtils.PathInside(process.cwd(), AbsoluteStaticPath);
            if (!isInside) {
                throw new Error("C4WebService upload path not in process cwd dir.");
            }
            if (this.m_StaticPath !== AbsoluteStaticPath) {
                this.m_App.use(Express.static(AbsoluteStaticPath));
            }
            this.m_UploadPath   = AbsoluteStaticPath;
        }

        // 设置compression
        if (config.compression) {
            // check
            this.m_App.use(Compression(config.compression));
        }

        this.m_Name     = config.name;
        this.m_Host     = config.host;
        this.m_Port     = config.port;
        this.m_Domain   = config.domain || this.m_Host;
        if (config.logger) {
            this.m_Logger   = config.logger;
        }

        this.m_bInit    = true;

        // 设置Body解析
        // 设置static目录
        // 注册Controller
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
    async launch() {
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
        this.m_App.use((err : any, req : any, res : any, next : any) => {
            res.status(500);
            res.json(JSON.stringify({
                Code: 500,
                Msg: '未知错误'
            }));
        });

        try {
            // 启动ACL，同步Role信息
            if (this.m_ACL.isEnabled() && this.m_ACL.isInit()) {
                await this.m_ACL.launch();
            }
        } catch (error) {
            if (this.m_Logger) {
                this.m_Logger.err ? this.m_Logger.err("C4WebService launch ACL failed, " + error) : this.m_Logger.error("C4WebService launch ACL failed, " + error);
            } else {
                console.error("C4WebService launch ACL failed, " + error);
            }
            throw error;
        }

        // 启动
        let Self = this;
        await new Promise((resolve, reject) => {
            if (Self.m_Type === "http") {
                Self.m_Http = Http.createServer(Self.m_App).listen(Self.m_Port, Self.m_Host, () => {
                    if (Self.m_Logger) {
                        Self.m_Logger.info(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                    } else {
                        console.log(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                    }
                    resolve();
                });
            } else if (Self.m_Type === "https") {
                if (TypeUtils.isEmptyObj(Self.m_CertConfig)) {
                    throw new Error("C4WebService https need cert config.");
                }
                Self.m_Http = Https.createServer(<CertConfig>Self.m_CertConfig, Self.m_App).listen(Self.m_Port, Self.m_Host, () => {
                    if (Self.m_Logger) {
                        Self.m_Logger.info(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                    } else {
                        console.log(Self.m_Name + " service listen on => " + Self.m_Host + ":" + Self.m_Port);
                    }
                    resolve();
                });
            } else {
                throw new Error("C4WebService type need http/https, but this service type is : " + Self.m_Type)
            }
        }).catch((err) => {
            throw err;
        })
    }

    /**
     * 停止
     */
    async stop() {
        if (!this.m_bInit
            || this.m_Http === null)
            return;

        let Self = this;
        await new Promise((resolve, reject) => {
            (<Http.Server>Self.m_Http).close(() => {
                this.m_Http = null;
                resolve();
            })
        })
    }

    /**
     * 重启
     */
    async reset() {
        if (!this.m_bInit)
            return;
        
        await this.stop();
        await this.m_ACL.reset();
        this.m_bInit = false;
    }

    /**
     * 添加Controllers
     * @param controllers controller对象或加载路径
     */
    async addControllers(controllers : Array<any>) : Promise<any>;
    async addControllers(controllerPaths :  string[]) : Promise<any>;
    async addControllers(arg: Array<any | string>) {
        const controllers = getControllers(arg);
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
        let ControllerDefine = defineControllers(controllers, this.m_StaticPath, this.m_UploadPath, this.m_Logger);
        for (let i = 0; i < ControllerDefine.Routers.length; i++) {
            if (ControllerDefine.Routers[i].path !== ""
                && ControllerDefine.Routers[i].path !== "/") {
                this.m_App.use(ControllerDefine.Routers[i].path, ControllerDefine.Routers[i].router);
            } else {
                this.m_App.use(ControllerDefine.Routers[i].router);
            }
        }

        if (this.m_ACL.isEnabled()) {
            // 添加Controller的资源矩阵配置
            for (let i = 0; i < ControllerDefine.ACLConfig.length; i++) {
                this.m_ACL.addAccCtrlTarget(ControllerDefine.ACLConfig[i])
            }

            // 添加静态资源的资源矩阵配置
            for (let i = 0; i < ControllerDefine.ACLStaticConfig.length; i++) {
                this.m_ACL.addAccCtrlTarget(ControllerDefine.ACLStaticConfig[i]);
            }

            // 上传资源矩阵
            await this.m_ACL.updateAclMatrix();
        }
    }
}
