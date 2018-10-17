import zlib = require('zlib')
import { C4AccessControlConfig } from 'c4accesscontrol/src/C4AccessControlTypes/C4AccessControlConfig';
import { JWTConfig, JWTAlgorithm } from 'c4jwt';

export type WebServiceType = "http" | "https" ;

export interface CookieParseOptions {
    decode ? (val : string) : string;
}

export interface CookieParserConfig {
    secret ?: string | string[];
    options ?: CookieParseOptions
};

export interface CookieConfig {
    domain      ?: string;
    encode      ?: any;
    expires     ?: Date;
    httpOnly    ?: boolean;
    maxAge      ?: number;
    path        ?: string;
    secure      ?: boolean;
    signed      ?: boolean;
    sameSite    ?: boolean | string;
};

export interface Serializer {
    stringify: Function;
    parse: Function;
};

export interface SessionRedisStoreConfig {
    client  ?: any;
    host    ?: string;
    port    ?: number;
    socket  ?: string;
    url     ?: string;
    ttl     ?: number;
    disableTTL  ?: boolean;
    db      ?: number;
    pass    ?: string;
    prefix  ?: string;
    unref   ?: boolean;
    serializer ?: Serializer | JSON;
    logErrors ?: boolean | ((error: string) => void);
    scanCount?: number;
};

export interface SessionConfig {
    name           ?: string;                   // 保存在cookie中的名字，默认connect.sid
    secret          : string;                   // 加密的密钥
    genid          ?: (req : any) => string;    // 自定义生成session ID的方法
    proxy          ?: boolean;                  // 是否新人代理，true，将在Header中设置"X-Forwarded-Proto",false只在TLS/SSL中使用，undefined则使用express配置
    resave         ?: boolean;                  // 是否允许session重新设置，要保证session在有操作的时候重置过期时间，需要设置为true
    rolling        ?: boolean;                  // 是否按照设置的maxAge重新设置session同步到cookie，要保证session在有操作的时候重置过期时间，需要设置为true
    saveUninitialized   ?: boolean;             // 是否允许存储未初始化的session
    store          ?: any;                      // 存储引擎
    unset          ?: string;                   // 控制session的销毁，'destory'则session在response结束时销毁，'keep'则在存储中保存，默认'keep'
    cookieConfig   ?: CookieConfig;             // cookie配置
};

export type OriginProcess = (origins : any, cb : any) => boolean;

export interface CROSConfig {
    origin                  : string | string[] | RegExp | boolean | OriginProcess;
    methods                ?: string | string[];
    allowedHeaders         ?: string | string[];
    exposedHeaders         ?: string | string[];
    credentials            ?: boolean;
    maxAge                 ?: number;
    preflightContinue      ?: boolean;
    optionsSuccessStatus   ?: number;
};

export type CompressionFilter = (req : any, res : any) => boolean;

export interface CompressionConfig {
    chunkSize   ?: number;
    level       ?: number;
    memLevel    ?: number;
    strategy    ?: number;
    threshold   ?: number;
    windowBits  ?: number;
    filter      ?: CompressionFilter;
};

export interface CertConfig {
    key     ?: string | Buffer | Array<Buffer | Object>;
    ca      ?: string | Buffer | Array<string | Buffer>;
    cert    ?: string | Buffer | Array<string | Buffer>;
    pfx     ?: string | Buffer | Array<string | Buffer | Object>;
    passphrase          ?: string;
    rejectUnauthorized  ?: boolean;     // default true
};

export interface WebServiceConfig {
    name                : string;                   // 服务名字
    host                : string;                   // IP或host
    port                : number;                   // 端口
    domain             ?: string;                   // domain
    serviceType         : WebServiceType;           // 服务类型（http或https）
    staticPath         ?: string;                   // 静态资源目录
    privateStaticPath  ?: string;                   // 需要权限才能访问的静态资源目录
    uploadPath         ?: string;                   // 上传资源的目录
    cookie             ?: CookieParserConfig;       // cookie的配置
    Session            ?: SessionConfig;            // session的配置
    compression        ?: CompressionConfig;        // 压缩的配置
    maxBodySize        ?: string;                   // 可以接收的body的最大大小
    crosConfig         ?: CROSConfig;               // 跨域访问配置
    allCros            ?: boolean;                  // 是否允许跨域
    logger             ?: any;                      // logger
    certConfig         ?: CertConfig;               // https的证书及加密配置
    jwtOption          ?: JWTConfig;                // JWT的配置
    aclOption          ?: C4AccessControlConfig;    // ACL的配置
};

// export type JWTAlgorithm = "HS256" | "HS384" | "HS512" | "RS256" | "RS384" | "RS512" | "ES256" | "ES384" | "ES512";

// /**
//  * Jwt配置项
//  */
// export type JwtOption={
//     /**
//      * 密钥,默认内置
//      */
//     jwtKey ?: string[] | {
//         // 自定义KeyID
//         [keyID : string] : string
//     };

//     /**
//      * Authorization字段名,默认:Token
//      */
//     authField ?: string;

//     /**
//      * JWT配置信息
//      */
//     // 签名算法
//     algorithm ?: JWTAlgorithm;

//     // token有效期
//     expiresIn ?: string;

//     // token的冻结期
//     notBefore ?: string;

//     // 签发者
//     issuer : string;

//     // token主题
//     subject ?: string;
// };
