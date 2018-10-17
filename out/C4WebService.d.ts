import Express = require('express');
import { WebServiceConfig } from './WebServiceTypes/WebServiceConfig';
export default class C4WebService {
    private m_Name;
    private m_Type;
    private m_App;
    private m_bInit;
    private m_DefaultBodyParser;
    private m_StaticPath;
    private m_UploadPath;
    private m_CORS;
    private m_Host;
    private m_Port;
    private m_Domain;
    private m_Logger;
    private m_Http;
    private m_CertConfig;
    private m_JWT;
    private m_ACL;
    constructor();
    /**
     * 初始化
     * @param config WebServiceConfig
     */
    init(config: WebServiceConfig): Promise<void>;
    /**
     * 获取Express对象
     */
    getApp(): Express.Express;
    /**
     * 启动
     */
    launch(): Promise<void>;
    /**
     * 停止
     */
    stop(): Promise<void>;
    /**
     * 重启
     */
    reset(): Promise<void>;
    /**
     * 添加Controllers
     * @param controllers controller对象或加载路径
     */
    addControllers(controllers: Array<any>): Promise<any>;
    addControllers(controllerPaths: string[]): Promise<any>;
}
