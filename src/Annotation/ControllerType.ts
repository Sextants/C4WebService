
export interface ParamConfig {
    index       : number;
    value       : string;
    required   ?: boolean;
    defaultValue?: any;
};

// export interface BodyConfig {
//     index       : number;
//     value       : string;
//     required   ?: boolean;
//     defaultValue?: any;
// };

export interface ControllerConfig {
    Desc       ?: string;           // 中文描述名
    Path        : string;
    Method      : string;
    Consumes   ?: string[];
    Produces   ?: string;
    Params     ?: string[];
    Headers    ?: string[];
    // SessionGenerate ?: boolean;
    // SessionRegenerate ?: boolean;
    // SessionCheck ?: boolean;
};

export interface ControllerOption {
    Name        : string;           // Controller对应的方法名
    Desc       ?: string;           // 函数中文描述名,如:新增人员/修改姓名
    Path        : string;           // 路径
    Method      : string;           // Http Method（GET、POST...）
    Consumes   ?: string[];         // request 的content-type
    Produces   ?: string;           // response 的content-type
    Params     ?: string[];         // url query的过滤器
    Headers    ?: string[];         // header的过滤器
    Handler    ?: (req : any, res : any, next : any) => void;   // 最终的路由处理函数
};

export interface ControllerOptions {
    MainPath : string;                          // RestController配置中主路径（对应Controller Group的配置）
    Options  : ControllerOption[];              // RequestMapping配置（对应每个controller的配置）
    Params  ?: {[key : string] : ParamConfig[]};// RequestParams配置
    Body    ?: {[key : string] : ParamConfig[]};// RequestBody配置
};

export interface ResponseOptions {
    Propertys : string[];
}

// import { AccessCtrlConfig } from 'c4accesscontrol'

// /**
//  * 权限控制表Tartag类型
//  */
// export type AclMetaType = {
//     ctrlAclObj: { [key: string]: AccessCtrlConfig };
//     ctrlAclParam: { [key: string]: { userParam?: number, actionParam?: number, loginUser?: number } };
// }

/**
 * Jwt结构体
 */
// export type JwtObjType = {
//     id?: string
// }

// export interface ACLOptions {
//     [key : string] : AccessCtrlConfig
// };
