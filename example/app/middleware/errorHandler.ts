import { Context } from 'egg';
import Exception from '@lib/exception';

/**
 * 捕获控制器抛出的错误。
 */
export default function(): any {
  return async (ctx: Context, next: () => Promise<any>) => {
    try {
      await next();
    } catch (err) {
      ctx.logger.error(err.stack);
      ctx.app.sentry.captureException(err);
      const error = err.message;
      const { DEFAULT_ERROR, PARAM_VALIDATE_ERROR, SYSTEM_VALIDATE_ERROR } = ctx.app.exception.usually;
      const { WECHAT_API_ERROR } = ctx.app.exception.wechat;
      if (err instanceof Exception) {
        const { code, error, status } = err;
        return ctx.exception(code, error, error, status);
      }
      switch (err.name) {
        case 'RequestValidationError':
          return ctx.exception(PARAM_VALIDATE_ERROR.code, PARAM_VALIDATE_ERROR.msg, error);
        case 'AssertionError [ERR_ASSERTION]':
          return ctx.exception(SYSTEM_VALIDATE_ERROR.code, SYSTEM_VALIDATE_ERROR.msg, error);
        case 'WeChatAPIError':
          return ctx.exception(WECHAT_API_ERROR.code, WECHAT_API_ERROR.msg, error);
        default:
      }
      const { code, msg } = DEFAULT_ERROR;
      // ctx.ctrlInfo是在egg-shell-plus中传入的
      if (ctx.ctrlInfo) {
        const { responseErrorCode, responseErrorMessage } = ctx.ctrlInfo;
        return ctx.exception(responseErrorCode || code, responseErrorMessage || msg, error);
      }
      ctx.exception(code, msg, error);
    }
  };
}
