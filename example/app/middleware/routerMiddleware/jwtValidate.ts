/**
 * 授权认证中间件
 * 对权限进行获取和认证
 */
import { Context } from 'egg';
import AuthService from '@service/auth/authorize';

export default (): any => {
  return async (ctx: Context, next: () => Promise<any>) => {
    let token: string = ctx.headers.authorization;
    const {
      UNAUTHORIED_ERROR,
      INCORRECT_TOKEN_FORMAT_ERROR,
      OVERDUE_LANDING_ERROR,
      LANDING_ELSEWHERE_ERROR,
    } = ctx.app.exception.authentication;
    // 效验token格式
    if (!token || !/JWT [\dA-Za-z=]+/.test(token)) {
      ctx.error(INCORRECT_TOKEN_FORMAT_ERROR, 401);
    }
    token = token.replace('JWT ', '');
    try {
      // token验证，失败会抛出错误
      ctx.app.jwt.verify(token);
      // jwt数据解码，并读取redis缓存的登陆信息
      const tokenInfo = ctx.app.jwt.decode(token);
      const { userId, password, isActive, platformId } = tokenInfo;
      ctx.logger.info(tokenInfo);
      const loginRedisKey = `authentication_${userId}_${password}_${isActive}`;
      const {
        token: redisToken,
        userinfo,
        roles,
        menus,
        permissions,
        expireTime,
      } = await AuthService.getUserLoginCache(ctx.app, loginRedisKey);
      // 如果redis中不存在登陆信息，提示登陆过期
      if (!redisToken || !userinfo || !roles || !menus || !permissions) {
        ctx.error(OVERDUE_LANDING_ERROR, 401);
      }
      // 给上下文设置platformId
      ctx.platform.id = platformId;
      // 判断redis存储的token跟用户传来的token是否一致，
      ctx.userData = {
        token: redisToken,
        userinfo,
        roles,
        permissions,
        menus,
      };
      if (ctx.userData.token !== token) {
        ctx.error(LANDING_ELSEWHERE_ERROR, 401);
      }
      // 登陆过期时间如果还差一天到期，自动续签
      const currentTime = new Date().getTime();
      if (expireTime - currentTime < 24 * 3600 * 1000) {
        AuthService.saveUserLoginCache(ctx.app, loginRedisKey, ctx.userData);
      }
    } catch (e) {
      ctx.logger.info(token);
      const error = e.code ? e : { ...UNAUTHORIED_ERROR, error: e.message };
      ctx.error(error, 401);
    }
    await next();
  };
};
