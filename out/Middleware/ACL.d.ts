import { RequestHandler } from 'express';
import { C4AccessControl } from 'c4accesscontrol';
export default function ACL(acl: C4AccessControl, logger: any): RequestHandler;
