import * as Joi from 'joi';
import * as md5 from 'js-md5';
import * as shortid from 'shortid';
import { Context } from 'egg';
import { Inject } from 'typedi';
import { Post, Controller, Summary, Parameters, IgnoreJwt, Get, Put, Delete } from 'egg-shell-plus';
import { PermissionWithAction } from '@decorator/permission';
import { ThirdPartyAuthStatus } from '@typeorm/account/entity/auth/thirdPartyAuth';
import OAuthService from '@service/auth/oauth';

const thirdPartyAppParams = {
  schools: Joi.array()
    .items(Joi.number().integer())
    .min(0)
    .max(200)
    .required()
    .description('对应的学校id列表，最多200个'),
  name: Joi.string()
    .max(50)
    .required()
    .description('第三方应用名称'),
  status: Joi.number()
    .integer()
    .default(ThirdPartyAuthStatus.NORMAL)
    .valid(ThirdPartyAuthStatus.NORMAL, ThirdPartyAuthStatus.DISABLE)
    .description('第三方应用名称'),
  remark: Joi.string()
    .max(500)
    .description('第三方应用描述'),
  tokenExpireTime: Joi.number()
    .integer()
    .default(2 * 60 * 60)
    .description('accessToken有效时间，单位（秒），不传默认2小时'),
};

@Controller('第三方应用授权认证')
export default class OAuthController {
  @Inject()
  readonly oAuthService: OAuthService;

  @Get()
  @Summary('获取第三方应用列表')
  @Parameters({
    query: Joi.object().keys({
      pageIndex: Joi.number()
        .integer()
        .min(1)
        .required()
        .description('当前页码'),
      pageSize: Joi.number()
        .integer()
        .min(1)
        .required()
        .description('每页记录数'),
    }),
  })
  @PermissionWithAction('read_oauth')
  async appList(ctx: Context) {
    const { pageIndex, pageSize } = ctx.query;
    return await this.oAuthService.findAndCount({
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      orderBy: 'createdAt_DESC',
    });
  }

  @Post()
  @Summary('新增第三方应用，并初始化appId和secret')
  @Parameters({
    body: Joi.object().keys({
      ...thirdPartyAppParams,
    }),
  })
  @PermissionWithAction('write_oauth')
  async createApp(ctx: Context) {
    const { name, remark, schools, status, tokenExpireTime } = ctx.body;
    const genRandom = (digit: number) =>
      Math.random()
        .toString()
        .slice(-digit);
    const appId = 'knows' + shortid.generate().toLowerCase();
    const appSecret = md5(ctx.helper.bcrypt.hash(genRandom(6) + new Date().getTime()));
    return await this.oAuthService.create({
      name,
      remark,
      status,
      appId,
      appSecret,
      tokenExpireTime,
      schools: schools.join(','),
    });
  }

  @Put('/update_app/:id')
  @Summary('修改第三方应用')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('第三方应用ID'),
    }),
    body: Joi.object().keys({
      ...thirdPartyAppParams,
    }),
  })
  @PermissionWithAction('write_oauth')
  async updateApp(ctx: Context) {
    const { name, remark, schools, status, tokenExpireTime } = ctx.body;
    return await this.oAuthService.update(
      {
        name,
        status,
        remark,
        tokenExpireTime,
        schools: schools.join(','),
      },
      {
        id: ctx.params.id,
      },
    );
  }

  @Delete('/delete_app/:id')
  @Summary('删除第三方应用')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('第三方应用ID'),
    }),
  })
  @PermissionWithAction('write_oauth')
  async deleteApp(ctx: Context) {
    const { id } = ctx.params;
    return await this.oAuthService.deleteById(id);
  }

  @IgnoreJwt
  @Get()
  @Summary('第三方应用获取accessToken，有效期2小时')
  @Parameters({
    query: Joi.object().keys({
      sign: Joi.string()
        .required()
        .description('数据签名，md5(appId+appSecret+时间戳)，有效期1分钟'),
      school: Joi.number()
        .integer()
        .required()
        .description('学校id'),
      appId: Joi.string()
        .required()
        .description('第三方应用ID'),
      appSecret: Joi.string()
        .required()
        .description('第三方应用密钥'),
      timestamp: Joi.number()
        .integer()
        .description('当前时间戳（毫秒）'),
    }),
  })
  async getAccessToken(ctx: Context) {
    const { sign, appId, appSecret, school, timestamp } = ctx.query;
    const thirdApp = await this.oAuthService.validateOAuth({
      sign,
      appId,
      appSecret,
      school,
      timestamp,
    });
    const accessToken = ctx.app.jwt.sign(
      {
        appId,
        school,
      },
      {
        expiresIn: thirdApp.tokenExpireTime || 2 * 60 * 60, // 默认有效期2小时
      },
    );
    return {
      token: ctx.helper.crypto.encrypt(accessToken),
    };
  }

  @IgnoreJwt
  @Get()
  @Summary('第三方应用验证accessToken')
  @Parameters({
    query: Joi.object().keys({
      token: Joi.string().description('需要效验的accessToken'),
      school: Joi.number()
        .integer()
        .description('学校id'),
      sign: Joi.string().description('数据签名，md5(appId+appSecret+时间戳)，有效期1分钟'),
      appId: Joi.string().description('第三方应用ID'),
      appSecret: Joi.string().description('第三方应用密钥'),
      timestamp: Joi.number()
        .integer()
        .description('当前时间戳（毫秒）'),
    }),
  })
  async verificationKey(ctx: Context) {
    const { jwt } = ctx.app;
    const { token, sign, appId, appSecret, school, timestamp } = ctx.query;
    const { TOKEN_UNAUTHORIED_ERROR, NOT_INTRODUCED_APPID_OR_SECRET_ERROR } = ctx.app.exception.oauth;
    if (token) {
      try {
        const decodedToken = ctx.helper.crypto.decrypt(token);
        // token验证，失败会抛出错误
        jwt.verify(decodedToken);
        return jwt.decode(decodedToken);
      } catch (e) {
        const error = e.code ? e : TOKEN_UNAUTHORIED_ERROR;
        ctx.error(error, 401);
      }
    }
    if (!appId || !appSecret) {
      ctx.error(NOT_INTRODUCED_APPID_OR_SECRET_ERROR);
    }
    await this.oAuthService.validateOAuth({
      sign,
      appId,
      appSecret,
      school,
      timestamp,
    });
    return { appId, school };
  }

  @IgnoreJwt
  @Get()
  @Summary('生成accessToken签名')
  @Parameters({
    query: Joi.object().keys({
      appId: Joi.string()
        .required()
        .description('第三方应用ID'),
      appSecret: Joi.string()
        .required()
        .description('第三方应用密钥'),
      timestamp: Joi.number()
        .integer()
        .description('当前时间戳（毫秒）'),
    }),
  })
  async generateSign(ctx: Context) {
    const { appId, appSecret, timestamp } = ctx.query;
    return this.oAuthService.generateSign({
      appId,
      appSecret,
      timestamp: String(timestamp),
    });
  }
}
