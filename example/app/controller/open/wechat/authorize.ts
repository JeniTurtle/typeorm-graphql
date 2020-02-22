import * as Joi from 'joi';
import { Context } from 'egg';
import { Controller, Summary, Parameters, IgnoreJwtAll, Get } from 'egg-shell-plus';
import { Inject } from 'typedi';
import AccountService from '@service/wechat/account';
import OAuthService from '@service/auth/oauth';

@IgnoreJwtAll
@Controller('调用微信相关接口的token验证')
export default class Template {
  @Inject()
  readonly accountService: AccountService;

  @Inject()
  readonly oAuthService: OAuthService;

  @Get()
  @Summary('按照固定规范生成一个临时token，用来获取access token')
  async generateTemporaryToken() {
    return this.oAuthService.generateTemporaryToken();
  }

  @Get()
  @Summary('根据时间戳加密code')
  @Parameters({
    query: Joi.object().keys({
      userId: Joi.string()
        .required()
        .description('用户ID'),
      separator: Joi.string()
        .default('@')
        .description('分隔符'),
    }),
  })
  async encryptCode(ctx: Context) {
    const { userId, separator } = ctx.query;
    // 获取当前的时间戳
    const timestamp = String(new Date().getTime());
    return ctx.helper.crypto.encrypt(`${userId}${separator}${timestamp}`);
  }

  @Get()
  @Summary('获取accessToken，有效期2小时')
  @Parameters({
    query: Joi.object().keys({
      identityId: Joi.string()
        .required()
        .description('唯一身份标识'),
      token: Joi.string()
        .required()
        .description('按照固定规范生成的临时token，(取当前时间戳倒序后AES加密，加密方式与登陆密码一致)'),
    }),
  })
  async getAccessToken(ctx: Context) {
    const { crypto } = ctx.helper;
    const { token, identityId } = ctx.query;
    const { INVAILD_IDENTITY_ID_ERROR } = ctx.app.exception.wechat;
    this.oAuthService.validateTemporaryToken(token);
    const account = await this.accountService.findOne({
      identityId_eq: identityId,
    });
    // 检查传入的身份ID是否有效
    if (!account) {
      ctx.error(INVAILD_IDENTITY_ID_ERROR);
    }
    const { id, appId, appSecret, wechatId } = account;
    // 生成access token
    const accessToken = ctx.app.jwt.sign(
      {
        id,
        identityId,
        appId,
        appSecret,
        wechatId,
      },
      {
        expiresIn: 2 * 60 * 60, // 有效期2小时
      },
    );
    return crypto.encrypt(accessToken);
  }
}
