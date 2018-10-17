export interface ParamConfig {
    index: number;
    value: string;
    required?: boolean;
    defaultValue?: any;
}
export interface ControllerConfig {
    Desc?: string;
    Path: string;
    Method: string;
    Consumes?: string[];
    Produces?: string;
    Params?: string[];
    Headers?: string[];
}
export interface ControllerOption {
    Name: string;
    Desc?: string;
    Path: string;
    Method: string;
    Consumes?: string[];
    Produces?: string;
    Params?: string[];
    Headers?: string[];
    Handler?: (req: any, res: any, next: any) => void;
}
export interface ControllerOptions {
    MainPath: string;
    Options: ControllerOption[];
    Params?: {
        [key: string]: ParamConfig[];
    };
    Body?: {
        [key: string]: ParamConfig[];
    };
}
export interface ResponseOptions {
    Propertys: string[];
}
/**
 * Jwt结构体
 */
