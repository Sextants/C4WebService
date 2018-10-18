import Express      = require('express');
import glob         = require('glob');
import Path         = require('path');
import MultiParty   = require('multiparty');
import XML2JS       = require('xml2js');
import FS           = require('fs');
import { TypeUtils, FSP, PathUtils } from 'c4utils';
import { getControllerOptions } from './Controller';
import { ParamConfig, ControllerOption, ControllerOptions} from './ControllerType';
import { getACLStaticMetaOption, ACResourceMatrix, processACL, getACLMetaOption, ACLOptions, processStaticACL } from 'c4accesscontrol'
import PathReg  = require('path-to-regexp');

function isImportable(file : string) : boolean {
    const filePart = file.slice(-3);
    return filePart === '.js' || (filePart === '.ts' && file.slice(-5) !== '.d.ts');
}

function getFullfilepathWithoutExtension(file: string): string {
    const parsedFile = Path.parse(file);
    return Path.join(parsedFile.dir, parsedFile.name);
}

function getFilenameWithoutExtension(file: string): string {
    return Path.parse(file).name;
}

const uniqueFilter = (item : any, index : any, arr : any) => arr.indexOf(item) === index;

export function getControllers(arg : Array<any | string>, debug : boolean = false) {
    let TargetDir = [
        './Controllers',
        './out/Controllers/'
    ];
    if (TypeUtils.isArray(arg) && arg.length > 0) {
        let Models : any[] = [];
        for (let i = 0; i < TargetDir.length; i++) {
            let LoadPaths   = arg.reduce((paths : any[], dir) => {
                if (TypeUtils.isObject(dir)
                    && dir.dir
                    && TypeUtils.isString(dir.dir)
                    && !TypeUtils.isEmptyStr(dir.dir)
                ) {
                    if (!glob.hasMagic(dir.dir)) {
                        let parsedFile  = Path.parse(dir.dir);
                        let curPath     = Path.join(parsedFile.dir, parsedFile.name);
                        let fullPath    = Path.join(process.cwd(), TargetDir[i], curPath, '*.*');
                        let IsInside    = PathUtils.PathInside(process.cwd(), fullPath);
                        if (IsInside) {
                            paths.push(fullPath);
                            return paths;
                        }
                    }
                } else if (TypeUtils.isString(dir)
                    && !TypeUtils.isEmptyStr(dir)) {
                    if (!glob.hasMagic(dir)) {
                        let parsedFile  = Path.parse(dir);
                        let curPath     = Path.join(parsedFile.dir, parsedFile.name);
                        let fullPath    = Path.join(process.cwd(), TargetDir[i], curPath + '.*');
                        let IsInside    = PathUtils.PathInside(process.cwd(), fullPath);
                        if (IsInside) {
                            paths.push(fullPath);
                            return paths;
                        }
                    }
                }
            }, []);
            Models.push(...FSP.getModules(LoadPaths, "", debug));
        }

        return Models;
    }

    return arg as Array<any>;
}

function needProcessMultiPart(consumes : string[]) {
    if (TypeUtils.isArray(consumes)
        && consumes.length > 0
        && TypeUtils.isString(consumes[0])) {
        for (let i = 0; i < consumes.length; i++) {
            if (consumes[i].toLowerCase() === 'multipart/form-data') {
                return true;
            }
        }
    } else if (TypeUtils.isString(consumes)
        && consumes.toLocaleString() === 'multipart/form-data') {
        return true;
    }
    return false;
}

async function processMultiPart(req : any, uploadPath : string) : Promise<any> {
    let UploadDir : any = {};
    if (!TypeUtils.isEmptyStr(uploadPath)) {
        UploadDir.uploadDir = uploadPath;
    }

    let Form    = new MultiParty.Form(UploadDir);
    let FormData= await new Promise((resolve, reject) => {
        Form.parse(req, (err, fields, files) => {
            if (err) {
                return reject(err);
            }

            resolve({
                fileds  : fields,
                files   : files
            });
        });
    }).catch((err) => {
        throw err;
    });

    return FormData;
}

function checkParamsOrHeaders(params : string[], conditions : any, isQuery : boolean, logger : any) {
    let CurType = isQuery ? 'Params' : 'Headers';
    if (!TypeUtils.isArray(params)
        || TypeUtils.isEmptyArray(params)
        || !TypeUtils.isString(params[0])) {
        if (logger)
            logger.debug('Check params : RequestMapping ' + CurType + ' is empty.')
        return true;
    }

    for (let i = 0; i < params.length; i++) {
        let CurParam = params[i];
        let KV = CurParam.replace(/\s/g, '').split('=');
        if (KV.length === 2) {
            // 限定了查询的值
            if (conditions[KV[0]] != KV[1]) {
                if (logger)
                    logger.debug('Check params : RequestMapping ' + CurType + ' <' + KV[0] + '> value unequal ' + KV[1] + '.');
                return false;
            }
        } if (KV.length === 1) {
            // 限定了查询参数名
            if (KV[0].slice(0, 1) === '!') {
                if (!TypeUtils.isEmptyObj(conditions[KV[0].slice(1)])) {
                    if (logger)
                        logger.debug('Check params : RequestMapping ' + CurType + ' <' + KV[0] + '> should not exist.');
                    return false;
                }
            } else {
                if (TypeUtils.isEmptyObj(conditions[KV[0]])) {
                    if (logger)
                        logger.debug('Check params : RequestMapping ' + CurType + ' <' + KV[0] + '> not exist.');
                    return false;
                }
            }
        } else {
            // 不支持，忽略
            if (logger)
                logger.debug('Check params : RequestMapping ' + CurType + ' unknown config : ' + CurParam);
        }
    }
    return true;
}

function getRequestParams(paramConfig : ParamConfig[], req : any) {
    if (TypeUtils.isEmptyObj(paramConfig)) {
        return [];
    }
    let Params = [];
    // let CurParamConfig = paramConfig.reverse();     // 颠倒顺序
    for (let i = 0; i < paramConfig.length; i++) {
        let CurConfig = paramConfig[i];
        if (!TypeUtils.isNullOrUndefined(req.query[CurConfig.value])
            || !TypeUtils.isNullOrUndefined(req.body[CurConfig.value])) {
            //if (CurConfig.index > Params.length) {
                // 把参数放到指定的位置
                // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
                //     Params.push(undefined);
                // }
                // if (!TypeUtils.isNullOrUndefined(req.query[CurConfig.value])) {
                //     Params.push(req.query[CurConfig.value]);
                if (!TypeUtils.isNullOrUndefined(req.query[CurConfig.value])) {
                    Params[CurConfig.index] = req.query[CurConfig.value];
                } else {
                    // Params.push(req.body[CurConfig.value]);
                    Params[CurConfig.index] = req.body(CurConfig.value);
                }
            //}
        } else {
            // 参数没找到
            if (TypeUtils.isNullOrUndefined(CurConfig.defaultValue)) {
              Params[CurConfig.index] = CurConfig.defaultValue;
            } else {
              if (CurConfig.required) {
                // 没有默认值，抛出错误
                throw new Error("Need query param : " + CurConfig.value);
              }
              Params[CurConfig.index] = undefined;
            }
            // if (CurConfig.required) {
            //     // 该参数为必传
            //     if (!TypeUtils.isNullOrUndefined(CurConfig.defaultValue)) {
            //         // 该参数有默认值，使用默认值
            //         // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
            //         //     Params.push(undefined);
            //         // }
            //         // Params.push(CurConfig.defaultValue);
            //         Params[CurConfig.index] = req.query[CurConfig.defaultValue];
            //     } else {
            //         // 没有默认值，抛出错误
            //         throw new Error("Need query param : " + CurConfig.value);
            //     }
            // }
        }
    }
    return Params;
}

function getRequestBody(paramConfig : ParamConfig[]/*{ index : number; value : string}[]*/, req : any) {
    if (TypeUtils.isEmptyObj(paramConfig)) {
        return [];
    }

    let Params = [];
    // let CurParamConfig = paramConfig.reverse();
    // let CurParamConfig = paramConfig;
    for (let i = 0; i < paramConfig.length; i++) {
        let CurConfig = paramConfig[i];
        if (!TypeUtils.isNullOrUndefined(req.body[CurConfig.value])) {
            // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
            //     Params.push(undefined);
            // }
            // Params.push(req.body[CurConfig.value]);
            Params[CurConfig.index] = req.body[CurConfig.value];
        } else {
          // 参数没找到
          if (TypeUtils.isNullOrUndefined(CurConfig.defaultValue)) {
            Params[CurConfig.index] = CurConfig.defaultValue;
          } else {
            if (CurConfig.required) {
              // 没有默认值，抛出错误
              throw new Error("Need body param : " + CurConfig.value);
            }
            Params[CurConfig.index] = undefined;
          }
            // // 参数没找到
            // if (CurConfig.required) {
            //     // 该参数为必传
            //     if (!TypeUtils.isNullOrUndefined(CurConfig.defaultValue)) {
            //         // 该参数有默认值，使用默认值
            //         // for (let j = 0; j < (CurConfig.index - Params.length); j++) {
            //         //     Params.push(undefined);
            //         // }
            //         // Params.push(CurConfig.defaultValue);
            //         Params[CurConfig.index] = req.body[CurConfig.defaultValue];
            //     } else {
            //         // 没有默认值，抛出错误
            //         throw new Error("Need body property : " + CurConfig.value);
            //     }
            // }
            // throw new Error("Need body property : " + CurConfig.value);
        }
    }

    return Params;
}

function mergeBindParams(...args : any[]) {
    let ParamsCount = arguments.length;
    let MaxLen      = 0;
    let Params      = [];
    for (let i = 0; i < ParamsCount; i++) {
        if (arguments[i].length > MaxLen)
            MaxLen = arguments[i].length;
    }

    for (let i = 0 ; i < MaxLen; i++) {
        Params.push(undefined);
    }

    for (let i = 0; i < ParamsCount; i++) {
        for (let j = 0; j < arguments[i].length;j ++) {
            if (arguments[i][j] !== undefined) {
                Params[j] = arguments[i][j];
            }
        }
    }

    return Params;
}

function resFormat(result : any, Produces : string, res : any) {
    if (Produces === 'text/plain') {
        res.set('Content-Type', Produces);
        res.end(JSON.stringify(result));
    } else if (Produces === 'text/html') {
        res.set('Content-Type', Produces);
        res.end('<p>' + JSON.stringify(result) + '</p>');
    } else if (Produces === 'text/xml'
        || Produces === 'application/xml') {
        let Builder = new XML2JS.Builder();
        let JSONXML = Builder.buildObject(result);
        res.set('Content-Type', Produces);
        res.end(JSONXML);
    } else if (Produces === 'application/json') {
        if (TypeUtils.isObject(result)) {
            res.json({
                code : result.code || 600,
                msg  : result.msg  || 'Succeed.',
                data : result.data || result
            });
        } else {
            res.json({
                code : 600,
                msg  : 'Succeed.',
                data : result
            });
        }
    } else {
        res.status(406).end("Not Acceptable.");
    }
}

function processHandlerResult(result : any, Produces : string, res : any) {
    /**TODO:
     * 增加对ACL的后置过滤的支持
     */
    if (TypeUtils.isString(result)) {
        // redirect:/xxxxpath@code
        // location:/xxxxxpath
        // file:/path|filename
        // @complete@
        let RedirectOpReg   = new RegExp('^(redirect|location):');
        let LocationOpReg   = new RegExp('^location:');
        let FileOpReg       = new RegExp('^file:');
        let RedirectCodeReg = new RegExp('@\\d+$', 'g');
        let FileNameReg     = new RegExp('(\\|[^/][\\s\\S]+)$', 'g');
        let CompleteReg     = new RegExp('^@complete@$');

        // 检查是否在handle中是否处理完毕（res已经调用）
        let IsComplete = CompleteReg.exec(result);
        if (null != IsComplete) {
            return;
        }

        // 处理重定向
        let IsRedirect = RedirectOpReg.exec(result);
        if (null !== IsRedirect) {
            let RedirectPath    = result.replace(RedirectOpReg, '');
            let RedirectCode : string | number  = '';
            let IsLocation      = LocationOpReg.exec(result);
            let IsRedirectCode  = RedirectCodeReg.exec(RedirectPath);
            if (null !== IsRedirectCode) {
                RedirectCode = IsRedirectCode[0];
                RedirectCode = parseInt(RedirectCode.replace('@', ''));
                RedirectPath = RedirectPath.replace(RedirectCodeReg, "");
            }
            if (IsLocation) {
                if (RedirectCode) {
                    res.statusCode = RedirectCode;
                    res.location(RedirectPath);
                    res.end();
                } else {
                    res.location(RedirectPath);
                    res.end();
                }
            } else {
                if (RedirectCode)
                    res.redirect(RedirectCode, RedirectPath);
                else
                    res.redirect(RedirectPath);
            }
            return;
        }

        // 处理文件下载
        let IsDownload = FileOpReg.exec(result);
        if (null !== IsDownload) {
            let DownloadPath = result.replace(FileOpReg, '');
            DownloadPath     = DownloadPath.replace(FileNameReg, '');
            // let HasFileName  = result.exec(FileNameReg);
            let HasFileName  = FileNameReg.exec(result);
            if (null !== HasFileName) {
                let FileName = HasFileName[0];
                FileName = FileName.replace('|', '');
                res.download(DownloadPath, FileName);
            } else {
                res.download(DownloadPath);
            }
            return;
        }
        resFormat(result, Produces, res);
    } else {
        resFormat(result, Produces, res);
    }
}

export function defineControllers(controllers : Array<any>, staticPath : string, uploadPath : string, logger : any) {
    let ControllerDefine : {
        Routers : any[];                        // 路由Controllers
        ACLConfig : ACResourceMatrix[];         // 接口ACL
        ACLStaticConfig : ACResourceMatrix[];   // 静态资源ACL
    } = {
        Routers : [],
        ACLConfig : [],
        ACLStaticConfig : []
    };
    let Routers : any[] = [];
    controllers.forEach(controller => {

        // 处理静态资源ACL
        let CurAclStaticOption : ACLOptions | null  = getACLStaticMetaOption(controller);
        if (!TypeUtils.isEmptyObj(CurAclStaticOption)) {
            let TempKeys = Object.keys(CurAclStaticOption);
            for (let i = 0; i < TempKeys.length; i++) {
                let TempOption  = processStaticACL((<ACLOptions>CurAclStaticOption)[TempKeys[i]], logger);
                ControllerDefine.ACLStaticConfig.push(TempOption);
            }
        }

        // 尝试获取Controller的配置
        let CurCOptions : ControllerOptions         = getControllerOptions(controller);
        if (CurCOptions.Options.length === 0) {
            return;
        }

        // 尝试获取ACL配置
        let CurAclOption : ACLOptions | null        = getACLMetaOption(controller);

        let CurRouter   = Express.Router();
        let CurMainPath = CurCOptions.MainPath || '';
        let CurOptions  = CurCOptions.Options;
        let ParamsConfig= CurCOptions.Params;
        let BodyConfig  = CurCOptions.Body;
        let CurSep      = Path.sep;
        let CurSepReg;
        if (CurSep === '\\') {
            CurSepReg   = new RegExp('(\\\\\\\\|\\\\)', 'g');
        } else {
            CurSepReg   = new RegExp(CurSep, 'g');
        }
        CurMainPath = Path.normalize('/' + CurMainPath).replace(CurSepReg, '/');
        for (let i = 0; i < CurOptions.length; i++) {
            let CurOption   = CurOptions[i];
            let CurPath     = CurOption.Path;
            CurPath = Path.normalize('/' + CurPath).replace(CurSepReg, '/');

            // 加入权限列表
            let CurACLConfig : ACResourceMatrix | null = null;
            if (!TypeUtils.isEmptyObj(CurAclOption)) {
                CurACLConfig = processACL(<ACResourceMatrix>((<ACLOptions>CurAclOption)[CurOption.Name]), CurPath, CurOption.Method, logger);
                if (null !== CurACLConfig) {
                    ControllerDefine.ACLConfig.push(CurACLConfig);
                }
            }

            let CurHandler = async (req : any, res : any, next : any) => {

                // check headers
                if (!checkParamsOrHeaders(<string[]>CurOption.Headers, req.headers, false, logger)) {
                    next();
                    return;
                }

                // check Params
                if (!checkParamsOrHeaders(<string[]>CurOption.Params, req.query, true, logger)) {
                    next();
                    return;
                }
                let Params     = [];

                // bind query param
                let BindParams = [];
                try {
                    if (ParamsConfig)
                        BindParams = getRequestParams(ParamsConfig[CurOption.Name], req)
                } catch (error) {
                    if (logger)
                        logger.debug(error);
                    next();
                    return;
                }

                // bind body param
                let BindBodyParams = [];
                try {
                    if (BodyConfig)
                        BindBodyParams = getRequestBody(BodyConfig[CurOption.Name], req);
                } catch (error) {
                    if (logger)
                        logger.debug(error);
                    next();
                    return;
                }

                // 优先使用body
                // if (BindBodyParams.length > 0) {
                //     Params = BindBodyParams;
                // } else if (BindParams.length > 0) {
                //     Params = BindParams;
                // }
                Params = mergeBindParams(BindParams, BindBodyParams);

                /**
                 * TODO: 处理Consumes ---》 request 的 content-type类型
                 */

                // check multipart
                if (needProcessMultiPart(<string[]>CurOption.Consumes)) {
                    let FormData = await processMultiPart(req, uploadPath).catch((err) => {
                        if (logger) {
                            logger.debug(err);
                        }
                        return;
                    });
                    if (logger) {
                        logger.debug("Multi part data : " + JSON.stringify(FormData));
                    }
                    req['formData'] = FormData;
                    // Params.push(FormData.fileds);
                    // Params.push(FormData.files);
                }

                // 最后添加logger、req和res
                Params.push(logger);
                Params.push(req);
                Params.push(res);

                let Result : any;
                try {
                    Result = await (<any>CurOption.Handler)(...Params);
                } catch (error) {
                    if (logger)
                        logger.err ? logger.err(error) : logger.error(error);
                    next();
                    return;
                }

                // 根据produces来选择返回的方式
                try {
                    processHandlerResult(Result, CurOption.Produces || 'application/json', res);
                } catch (error) {
                    if (logger)
                        logger.debug(error);
                    next();
                    return;
                }
            };

            // bind router path and handler
            if (CurOption.Method === "GET") {
                CurRouter.get(CurPath, CurHandler);
            } else if (CurOption.Method === "POST") {
                CurRouter.post(CurPath, CurHandler);
            } else if (CurOption.Method === "PUT") {
                CurRouter.put(CurPath, CurHandler);
            } else if (CurOption.Method === "PATCH") {
                CurRouter.patch(CurPath, CurHandler);
            } else if (CurOption.Method === "DELETE") {
                CurRouter.delete(CurPath, CurHandler);
            } else if (CurOption.Method === "ALL") {
                CurRouter.all(CurPath, CurHandler);
            } else {
                if (logger)
                    logger.warn("DefineControllers unknown method type : " + CurOption.Method);
            }
        }
        Routers.push({
            path    : CurMainPath,
            router  : CurRouter
        });
    });

    ControllerDefine.Routers = Routers;

    // return Routers;
    return ControllerDefine;
}
