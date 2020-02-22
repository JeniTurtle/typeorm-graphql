import { Context } from 'egg';
import * as xmljs from 'xml-js';

/**
 * text/xml格式数据转json
 */
export default function(): any {
  return async (ctx: Context, next: () => Promise<any>) => {
    const { header, body } = ctx.request;
    if (header['content-type'] === 'text/xml' && body) {
      try {
        const xmlBody = xmljs.xml2js(body, { compact: true });
        // @ts-ignore
        ctx.request.body = xmlBody.xml || {};
      } catch (err) {
        throw err;
      }
    }
    await next();
  };
}
