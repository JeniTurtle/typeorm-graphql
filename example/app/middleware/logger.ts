import { Context } from 'egg';

/**
 * 打印请求日志
 */
export default function(): any {
  return async (ctx: Context, next: () => Promise<any>) => {
    const start = new Date().getTime();
    await next();
    const ms = new Date().getTime() - start;
    const params = ctx.url === '/graphql' ? '' : JSON.stringify(ctx.request.body);
    ctx.app.logger.info('[%s] %s (%s)ms [params] %s', ctx.method, ctx.url, ms, params);
  };
}
