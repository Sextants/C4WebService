import { ACResourceMatrix } from 'c4accesscontrol';
export declare function getControllers(arg: Array<any | string>, debug?: boolean): any[];
export declare function defineControllers(controllers: Array<any>, staticPath: string, uploadPath: string, logger: any): {
    Routers: any[];
    ACLConfig: ACResourceMatrix[];
    ACLStaticConfig: ACResourceMatrix[];
};
