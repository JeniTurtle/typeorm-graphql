/**
 * 授权认证中间件
 * 对权限进行获取和认证
 */
import { Context } from 'egg';
import { Parameters, Joi } from 'egg-shell-plus';
import { JoiObject } from 'joi';

/**
 * 增加默认header装饰器
 * @param options
 */
export const ParametersWithToken = (
  options: {
    headers?: JoiObject;
    body?: JoiObject;
    pathParams?: JoiObject;
    query?: JoiObject;
  } = {},
) => {
  options.headers = Joi.object().keys({
    message_access_token: Joi.string().required(),
  });
  return Parameters(options);
};

export default (): any => {
  return async (ctx: Context, next: () => Promise<any>) => {
    const { jwt } = ctx.app;
    const token: string = ctx.headers.message_access_token;
    const { UNAUTHORIED_ERROR, INCORRECT_TOKEN_FORMAT_ERROR } = ctx.app.exception.authentication;
    // 效验token格式
    if (!token) {
      ctx.error(INCORRECT_TOKEN_FORMAT_ERROR);
    }
    try {
      // token解码
      const decodedToken = ctx.helper.crypto.decrypt(token);
      // token验证，失败会抛出错误
      jwt.verify(decodedToken);
      ctx.wechatAccount = jwt.decode(decodedToken);
    } catch (e) {
      const error = e.code ? e : { ...UNAUTHORIED_ERROR, error: e.message };
      ctx.error(error, 401);
    }
    await next();
  };
};
