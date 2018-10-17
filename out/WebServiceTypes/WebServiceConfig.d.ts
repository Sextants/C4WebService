/// <reference types="node" />
import { C4AccessControlConfig } from 'c4accesscontrol/src/C4AccessControlTypes/C4AccessControlConfig';
import { JWTConfig } from 'c4jwt';
export declare type WebServiceType = "http" | "https";
export interface CookieParseOptions {
    decode?(val: string): string;
}
export interface CookieParserConfig {
    secret?: string | string[];
    options?: CookieParseOptions;
}
export interface CookieConfig {
    domain?: string;
    encode?: any;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    secure?: boolean;
    signed?: boolean;
    sameSite?: boolean | string;
}
export interface Serializer {
    stringify: Function;
    parse: Function;
}
export interface SessionRedisStoreConfig {
    client?: any;
    host?: string;
    port?: number;
    socket?: string;
    url?: string;
    ttl?: number;
    disableTTL?: boolean;
    db?: number;
    pass?: string;
    prefix?: string;
    unref?: boolean;
    serializer?: Serializer | JSON;
    logErrors?: boolean | ((error: string) => void);
    scanCount?: number;
}
export interface SessionConfig {
    name?: string;
    secret: string;
    genid?: (req: any) => string;
    proxy?: boolean;
    resave?: boolean;
    rolling?: boolean;
    saveUninitialized?: boolean;
    store?: any;
    unset?: string;
    cookieConfig?: CookieConfig;
}
export declare type OriginProcess = (origins: any, cb: any) => boolean;
export interface CROSConfig {
    origin: string | string[] | RegExp | boolean | OriginProcess;
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
}
export declare type CompressionFilter = (req: any, res: any) => boolean;
export interface CompressionConfig {
    chunkSize?: number;
    level?: number;
    memLevel?: number;
    strategy?: number;
    threshold?: number;
    windowBits?: number;
    filter?: CompressionFilter;
}
export interface CertConfig {
    key?: string | Buffer | Array<Buffer | Object>;
    ca?: string | Buffer | Array<string | Buffer>;
    cert?: string | Buffer | Array<string | Buffer>;
    pfx?: string | Buffer | Array<string | Buffer | Object>;
    passphrase?: string;
    rejectUnauthorized?: boolean;
}
export interface WebServiceConfig {
    name: string;
    host: string;
    port: number;
    domain?: string;
    serviceType: WebServiceType;
    staticPath?: string;
    privateStaticPath?: string;
    uploadPath?: string;
    cookie?: CookieParserConfig;
    Session?: SessionConfig;
    compression?: CompressionConfig;
    maxBodySize?: string;
    crosConfig?: CROSConfig;
    allCros?: boolean;
    logger?: any;
    certConfig?: CertConfig;
    jwtOption?: JWTConfig;
    aclOption?: C4AccessControlConfig;
}
