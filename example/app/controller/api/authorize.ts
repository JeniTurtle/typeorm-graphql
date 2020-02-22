import * as Joi from 'joi';
import { Context } from 'egg';
import { Post, Controller, Summary, Parameters, IgnoreJwt, HiddenAll } from 'egg-shell-plus';
import { Inject, Service } from 'typedi';
import AuthService from '@service/auth/authorize';

@HiddenAll
@Controller('用户登陆接口')
export default class AuthController {
  @Inject()
  readonly authService: AuthService;

  @IgnoreJwt
  @Post()
  @Summary('用户登陆接口')
  @Parameters({
    body: Joi.object().keys({
      username: Joi.string()
        .max(50)
        .required()
        .description('用户名'),
      password: Joi.string()
        .min(6)
        .max(50)
        .required()
        .description('密码'),
      platformId: Joi.string()
        .required()
        .description('平台ID'),
      encryption: Joi.number()
        .integer()
        .valid(0, 1)
        .default(0)
        .description('密码是否加密；0不加密，1加密'),
    }),
  })
  async login(ctx: Context) {
    const { username, password, encryption, platformId } = ctx.request.body;
    const decodePwd: string = encryption === 1 ? ctx.helper.crypto.decrypt(password) : password;
    return await this.authService.login({
      username,
      password: decodePwd,
      checkStaff: true,
      platformId,
    });
  }

  /**
   * 退出登录
   * @param ctx
   */
  @Post()
  @Summary('用户注销接口')
  async logout(ctx: Context) {
    const count: number = await this.authService.logout();
    if (count < 1) {
      ctx.logger.error('退出登陆异常');
    }
    return '退出登陆成功';
  }
}
