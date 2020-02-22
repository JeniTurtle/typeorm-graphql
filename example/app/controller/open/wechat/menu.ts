import * as Joi from 'joi';
import { Context } from 'egg';
import { Post, Controller, Summary, Parameters, Get } from 'egg-shell-plus';
import { Inject } from 'typedi';
import AccountService from '@service/wechat/account';
import { PermissionWithAction } from '@decorator/permission';

@Controller('微信账户管理接口')
export default class Menu {
  @Inject()
  readonly accountService: AccountService;

  @Get()
  @Summary('获取自定义菜单配置')
  @Parameters({
    query: Joi.object().keys({
      wechatId: Joi.string()
        .required()
        .description('微信公众号账号'),
    }),
  })
  @PermissionWithAction('read_wechat_menu')
  async list(ctx: Context) {
    const { wechatId } = ctx.query;
    const wechatApi = await this.accountService.getWechatApi(wechatId);
    return await wechatApi.getMenu();
  }

  @Post()
  @Summary('创建自定义菜单配置')
  @Parameters({
    body: Joi.object().keys({
      wechatId: Joi.string()
        .required()
        .description('微信公众号账号'),
      menusData: Joi.object()
        .required()
        .description('自定义菜单数据'),
    }),
  })
  @PermissionWithAction('write_wechat_menu')
  async create(ctx: Context) {
    const { wechatId, menusData } = ctx.body;
    const wechatApi = await this.accountService.getWechatApi(wechatId);
    return await wechatApi.createMenu(menusData);
  }
}
