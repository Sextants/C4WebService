import { RequestHandler } from 'express';
import { C4JWT } from 'c4jwt';
export default function JWT(jwt: C4JWT, authField: string, logger: any): RequestHandler;
