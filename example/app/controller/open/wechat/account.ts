import * as Joi from 'joi';
import * as md5 from 'js-md5';
import { Context } from 'egg';
import { IgnoreJwt, Before, Post, Controller, Summary, Parameters, Get, Put, Delete } from 'egg-shell-plus';
import { Inject } from 'typedi';
import msgTokenValidate, { ParametersWithToken } from '@middleware/routerMiddleware/msgTokenValidate';
import AccountService from '@service/wechat/account';
import AccountConfigService from '@service/wechat/accountConfig';
import { PermissionWithAction } from '@decorator/permission';

@Controller('微信账户管理接口')
export default class Account {
  @Inject()
  readonly accountService: AccountService;

  @Inject()
  readonly accountConfigService: AccountConfigService;

  @Post()
  @Summary('新增微信账户')
  @Parameters({
    body: Joi.object().keys({
      accountName: Joi.string()
        .required()
        .description('账户名称'),
      appId: Joi.string()
        .required()
        .description('微信公众号AppId'),
      appSecret: Joi.string()
        .required()
        .description('微信公众号AppSecret'),
      wechatId: Joi.string()
        .required()
        .description('微信公众号账号'),
      organizationId: Joi.string().description('组织机构ID'),
    }),
  })
  @PermissionWithAction('write_wechat_account')
  async create(ctx: Context) {
    const { appId, appSecret } = ctx.body;
    ctx.body.identityId = md5(ctx.helper.bcrypt.hash(appId + appSecret));
    return await this.accountService.createAccount(ctx.body);
  }

  @Get()
  @Summary('获取微信账户列表')
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
  @PermissionWithAction('read_wechat_account')
  async list(ctx: Context) {
    const { pageIndex, pageSize } = ctx.query;
    return await this.accountService.findAndCount({
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      orderBy: 'createdAt_DESC',
    });
  }

  @Put('/update/:accountId')
  @Summary('修改微信账户')
  @Parameters({
    pathParams: Joi.object().keys({
      accountId: Joi.string()
        .required()
        .description('账户id'),
    }),
    body: Joi.object().keys({
      accountName: Joi.string().description('账户名称'),
      appId: Joi.string().description('微信公众号AppId'),
      appSecret: Joi.string().description('微信公众号AppSecret'),
      wechatId: Joi.string().description('微信公众号账号'),
      organizationId: Joi.string().description('组织机构ID'),
    }),
  })
  @PermissionWithAction('write_wechat_account')
  async update(ctx: Context) {
    const id = ctx.params.accountId;
    return await this.accountService.updateAccount({
      id,
      ...ctx.body,
    });
  }

  /**
   * 删除权限
   * @param ctx
   */
  @Delete('/delete/:accountId')
  @Summary('删除微信账户')
  @Parameters({
    pathParams: Joi.object().keys({
      accountId: Joi.string()
        .required()
        .description('菜单账户id'),
    }),
  })
  @PermissionWithAction('write_wechat_account')
  async delete(ctx: Context) {
    const { accountId } = ctx.params;
    return await this.accountService.deleteAccount(accountId);
  }

  @Get('/config/list')
  @Summary('获取微信账户配置列表')
  @Parameters({
    query: Joi.object().keys({
      wechatId: Joi.string()
        .required()
        .description('微信公众号ID'),
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
  @PermissionWithAction('read_wechat_account_config')
  async configList(ctx: Context) {
    const { pageIndex, pageSize, wechatId } = ctx.query;
    return await this.accountConfigService.findAndCount({
      where: {
        wechatId,
      },
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      orderBy: 'createdAt_DESC',
    });
  }

  @IgnoreJwt
  @Get('/config/info')
  @Summary('使用accessToken获取当前账户微信配置')
  @Before(msgTokenValidate)
  @ParametersWithToken()
  async configInfo(ctx: Context) {
    const { appId } = ctx.wechatAccount;
    return await this.accountService.getAccountWithConfigInfo(appId);
  }

  @Get('/config/detail/:wechatId')
  @Summary('获取当前账户微信配置')
  @Parameters({
    pathParams: Joi.object().keys({
      wechatId: Joi.string()
        .required()
        .description('唯一ID'),
    }),
  })
  @PermissionWithAction('read_wechat_account_config')
  async configDetail(ctx: Context) {
    const { wechatId } = ctx.params;
    return await this.accountConfigService.findOne({
      wechatId,
    });
  }

  @Put('/config/update/:configId')
  @Summary('修改微信账户配置')
  @Parameters({
    pathParams: Joi.object().keys({
      configId: Joi.string()
        .required()
        .description('账户配置id'),
    }),
    body: Joi.object().keys({
      wechatId: Joi.string().description('微信公众号AppId'),
      followReply: Joi.string().description('公众号关注回复'),
      messageCallbackUrl: Joi.string().description('模板消息推送回调地址（k12-node服务配路径即可）'),
      subMchId: Joi.string().description('微信支付子商户号'),
    }),
  })
  @PermissionWithAction('write_wechat_account_config')
  async updateConfig(ctx: Context) {
    const { configId } = ctx.params;
    return await this.accountConfigService.updateAccount({
      id: configId,
      ...ctx.body,
    });
  }
}
