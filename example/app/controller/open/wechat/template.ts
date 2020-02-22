import * as Joi from 'joi';
import * as assert from 'assert';
import * as uuidV1 from 'uuid/v1';
import { Context } from 'egg';
import { Inject } from 'typedi';
import { DeepPartial } from 'typeorm';
import {
  Parameters,
  Post,
  Put,
  Controller,
  Summary,
  Before,
  IgnoreJwt,
  Get,
  Delete,
  Description,
  ResponseMessage,
} from 'egg-shell-plus';
import msgTokenValidate, { ParametersWithToken } from '@middleware/routerMiddleware/msgTokenValidate';
import PublishService from '@service/rabbitmq/publish';
import MessageTaskService from '@service/wechat/messageTask';
import TemplateSettingService from '@service/wechat/templateSetting';
import TemplateLibService from '@service/wechat/templateLibrary';
import AccountService from '@service/wechat/account';
import AccountConfigService from '@service/wechat/accountConfig';
import { WxMsgTaskType, WxMsgTaskProgress, WxMsgIsDelay } from '@typeorm/account/entity/wechat/messageTask';
import { PermissionWithAction } from '@decorator/permission';
import { WxTemplateSetting } from '@typeorm/account/entity/wechat/templateSetting';

@Controller('微信模板消息接口')
export default class Template {
  @Inject()
  private publishService: PublishService;

  @Inject()
  readonly accountService: AccountService;

  @Inject()
  readonly accountConfigService: AccountConfigService;

  @Inject()
  private messageTaskService: MessageTaskService;

  @Inject()
  readonly templateSetService: TemplateSettingService;

  @Inject()
  readonly templateLibService: TemplateLibService;

  @Post('/library/create')
  @Summary('新增微信模板库模板')
  @Parameters({
    body: Joi.object().keys({
      templateShortId: Joi.string()
        .required()
        .description('模板ID'),
      templateName: Joi.string()
        .required()
        .description('模板名称'),
    }),
  })
  @PermissionWithAction('write_wechat_template_library')
  async createLibrary(ctx: Context) {
    const { templateShortId, templateName } = ctx.body;
    const { TEMPLATE_LIBRARY_NAME_REPEAT_ERROR, TEMPLATE_LIBRARY_ID_REPEAT_ERROR } = ctx.app.exception.template;
    const templateLib = await this.templateLibService.findOne([
      {
        templateName,
      },
      {
        templateShortId,
      },
    ]);
    if (!templateLib) {
      return await this.templateLibService.create(ctx.body);
    }
    if (templateLib.templateShortId === templateShortId) {
      ctx.error(TEMPLATE_LIBRARY_ID_REPEAT_ERROR);
    } else if (templateLib.templateName === templateName) {
      ctx.error(TEMPLATE_LIBRARY_NAME_REPEAT_ERROR);
    }
  }

  @Get('/library/list')
  @Summary('获取微信模板库模板列表')
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
  @PermissionWithAction('read_wechat_template_library')
  async libraryList(ctx: Context) {
    const { pageIndex, pageSize } = ctx.query;
    return await this.templateLibService.findAndCount({
      offset: (pageIndex - 1) * pageSize,
      limit: pageSize,
      orderBy: 'createdAt_DESC',
    });
  }

  @Put('/library/update/:id')
  @Summary('修改微信模板库模板')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('唯一ID'),
    }),
    body: Joi.object().keys({
      templateShortId: Joi.string().description('模板ID'),
      templateName: Joi.string().description('模板名称'),
    }),
  })
  @PermissionWithAction('write_wechat_template_library')
  async updateLibrary(ctx: Context) {
    const { id } = ctx.params;
    await this.templateLibService.checkUsed(id);
    return await this.templateLibService.updateById(ctx.body, id);
  }

  @Delete('/library/delete/:id')
  @Summary('删除微信模板库模板')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('唯一ID'),
    }),
  })
  @PermissionWithAction('write_wechat_template_library')
  async deleteLibrary(ctx: Context) {
    const {
      params: { id },
    } = ctx;
    await this.templateLibService.checkUsed(id);
    return await this.templateLibService.deleteById(id);
  }

  @Post('/setting/create')
  @Summary('新增微信消息模板')
  @Parameters({
    body: Joi.object().keys({
      appId: Joi.string()
        .required()
        .description('微信公众号AppId'),
      templateShortId: Joi.string()
        .required()
        .description('公共模板ID'),
      templateName: Joi.string()
        .required()
        .description('模板名称'),
    }),
  })
  @PermissionWithAction('write_wechat_template_setting')
  async createSetting(ctx: Context) {
    const { body } = ctx;
    const { TEMPLATE_LIBRARY_NAME_REPEAT_ERROR } = ctx.app.exception.template;
    const wechatApi = await this.accountService.getWechatApi(body.appId);
    const { template_list: templateList } = (await wechatApi.getAllPrivateTemplate()) || [];
    const target = templateList.find(template => template.title === body.templateName);
    if (target) {
      ctx.error(TEMPLATE_LIBRARY_NAME_REPEAT_ERROR);
    }
    const { template_id: templateId } = await wechatApi.addTemplate(body.templateShortId);
    assert(templateId, '添加微信模板消息接口请求异常');
    return await this.templateSetService.create({
      ...ctx.body,
      templateId,
    });
  }

  @Get('/setting/list/by_appid')
  @Summary('获取指定公众号的消息模板列表')
  @Parameters({
    query: Joi.object().keys({
      appId: Joi.string()
        .required()
        .description('微信公众号AppId'),
    }),
  })
  @PermissionWithAction('read_wechat_template_setting')
  async settingListByAppId(ctx: Context) {
    const { appId } = ctx.query;
    return await this.templateSetService.find({
      where: {
        appId,
      },
    });
  }

  @Get('/setting/list/by_shortid')
  @Summary('获取模板库已设置的模板列表')
  @Parameters({
    query: Joi.object().keys({
      templateShortId: Joi.string()
        .required()
        .description('模板库ID'),
    }),
  })
  @PermissionWithAction('read_wechat_template_setting')
  async settingListByTemplateShortId(ctx: Context) {
    const { templateShortId } = ctx.query;
    return await this.templateSetService.find({
      where: {
        templateShortId,
      },
    });
  }

  @Post('/setting/batch_export')
  @Summary('从微信服务器拉取模板列表同步到数据库(慎重使用)')
  @Parameters({
    query: Joi.object().keys({
      appId: Joi.string()
        .required()
        .description('微信公众号AppId'),
    }),
  })
  @Description('使用前确保当前公众号未设置过消息模板，以及模板库不存在同名的模板')
  @PermissionWithAction('write_wechat_template_setting')
  async settingBatchExport(ctx: Context) {
    const { appId } = ctx.query;
    const wechatApi = await this.accountService.getWechatApi(appId);
    const { template_list: templateList } = await wechatApi.getAllPrivateTemplate();
    const templateLibs = await this.templateLibService.find();
    assert(Array.isArray(templateList), '获取消息模板接口异常');
    const saveData = templateList
      .map(template => {
        const templateLib = templateLibs.find(item => item.templateName === template.title);
        if (templateLib) {
          return {
            appId,
            templateId: template.template_id,
            templateName: template.title,
            templateShortId: templateLib.templateShortId,
          };
        }
      })
      .filter(item => !!item);
    return await this.templateSetService.createMany(saveData);
  }

  @Post('/setting/initialize')
  @Summary('初始化公众号消息模板(仅限新公众号使用)')
  @Parameters({
    query: Joi.object().keys({
      appId: Joi.string()
        .required()
        .description('微信公众号AppId'),
    }),
  })
  @Description('会先清除当前公众号所有消息模板，然后重新从模板库添加')
  @PermissionWithAction('write_wechat_template_setting')
  async settingInitialize(ctx: Context) {
    const { appId } = ctx.query;
    const wechatApi = await this.accountService.getWechatApi(appId);
    const { template_list: templateList } = (await wechatApi.getAllPrivateTemplate()) || [];
    const templateLibs = await this.templateLibService.find();
    templateList.forEach(async item => {
      try {
        await wechatApi.delPrivateTemplate(item.template_id);
        await this.templateSetService.delete({
          templateId: item.template_id,
        });
      } catch (err) {
        ctx.logger.error(err);
      }
    });
    const saveData: Array<DeepPartial<WxTemplateSetting>> = [];
    templateLibs.forEach(template => {
      try {
        const { template_id: templateId } = wechatApi.addTemplate(template.templateShortId);
        saveData.push({
          appId,
          templateId,
          templateName: template.templateName,
          templateShortId: template.templateShortId,
        });
      } catch (err) {
        ctx.logger.error(err);
      }
    });
    return await this.templateSetService.createMany(saveData);
  }

  @Delete('/setting/delete/:templateId')
  @Summary('删除微信消息模板设置')
  @Parameters({
    pathParams: Joi.object().keys({
      templateId: Joi.string()
        .required()
        .description('公众号的消息模板ID'),
    }),
    query: Joi.object().keys({
      appId: Joi.string()
        .required()
        .description('微信公众号AppId'),
    }),
  })
  @PermissionWithAction('write_wechat_template_setting')
  public async delete(ctx: Context) {
    const { appId } = ctx.query;
    const { templateId } = ctx.params;
    const wechatApi = await this.accountService.getWechatApi(appId);
    const { errcode } = await wechatApi.delPrivateTemplate(templateId);
    assert(errcode === 0, '删除消息模板接口异常');
    return await this.templateSetService.delete({
      templateId,
    });
  }

  @IgnoreJwt
  @Post()
  @Summary('发送不同内容的公众号模板消息给多个用户')
  @Before(msgTokenValidate)
  @ParametersWithToken({
    body: Joi.object()
      .keys({
        delayTime: Joi.date()
          .timestamp()
          .description('指定时间发送，时间格式为时间戳，不指定为立即发送'),
        tousers: Joi.array()
          .items(Joi.string())
          .min(1)
          .description('接收者openid列表'),
        templateId: Joi.string()
          .required()
          .description('模板ID'),
        url: Joi.string().description('网页跳转地址，跟urls只能选一个'),
        urls: Joi.array()
          .items(Joi.string())
          .description('多个网页跳转地址，数量和顺序与tousers一致，跟url只能选一个'),
        color: Joi.string().description('模板内容字体颜色，不填默认为黑色'),
        data: Joi.object().description('模板数据'),
        dataList: Joi.array()
          .items(Joi.object())
          .description('多个模板数据，数量和顺序与tousers一致，跟data只能选一个'),
        miniprogram: Joi.object()
          .keys({
            appid: Joi.string().description('小程序app_id'),
            pagepath: Joi.string().description('小程序跳转地址，跟pagepaths只能选一个'),
            pagepaths: Joi.array()
              .items(Joi.string())
              .description('多个小程序跳转地址，数量和顺序与tousers一致，跟pagepath只能选一个'),
          })
          .description('跳小程序所需数据，不需跳小程序可不用传该数据'),
      })
      .without('data', 'dataList')
      .without('url', 'urls')
      .without('pagepath', 'pagepaths'),
  })
  @ResponseMessage('消息已写入队列，等待回调')
  async send(ctx: Context) {
    const resp: any = {
      succeed: [],
      failed: [],
    };
    const { TEMPLATE_MESSAGE_WRITE_MQ_ERROR } = ctx.app.exception.template;
    const { delayTime, tousers, templateId: templateShortId, url, urls, dataList, color, data, miniprogram } = ctx.body;
    const { wechatId, appId } = ctx.wechatAccount;
    const tempMiniprogram = miniprogram || {};
    const { pagepath, pagepaths, appid } = tempMiniprogram;
    const unionids = Array.from(new Set(tousers));
    const expiration = delayTime - new Date().getTime();
    const isDelay = expiration > 1000;
    const saveData = {
      batchCount: unionids.length,
      params: JSON.stringify(ctx.body),
      executorId: ctx.wechatAccount.id,
      type: WxMsgTaskType.TEMPLATE,
      progress: WxMsgTaskProgress.READY,
      isDelay: isDelay ? WxMsgIsDelay.YES : WxMsgIsDelay.NO,
      planTime: isDelay ? delayTime : null,
    };
    assert(wechatId, '该账户未配置有效的微信公众号ID');
    assert(data || dataList, 'data和dataList必须传入一个');
    miniprogram && assert(pagepath || pagepaths, 'pagepath和pagepaths必须传入一个');
    urls && assert(tousers.length === urls.length, 'urls数量与tousers数量不一致');
    dataList && assert(tousers.length === dataList.length, 'dataList数量与tousers数量不一致');
    miniprogram && pagepaths && assert(tousers.length === pagepaths.length, 'pagepaths数量与tousers数量不一致');
    try {
      // 查询数据库中对应的模板ID
      const templateInfo = await this.templateSetService.findOne({
        appId,
        templateShortId,
      });
      const templateId = templateInfo && templateInfo.templateId;
      assert(templateId, '找不到对应的消息模板ID');
      // 获取微信账户配置
      const accountConfig = await this.accountConfigService.findOne({
        wechatId,
      });
      const messageCallbackUrl = accountConfig ? accountConfig.messageCallbackUrl || '' : '';
      // 往数据库写入任务信息
      const { id: taskId } = await this.messageTaskService.create(saveData);
      // 往redis写入任务数量
      const redisTaskCountKey = `${taskId}_count`;
      await ctx.app.redis.set(redisTaskCountKey, unionids.length);
      // 消息批量写入队列
      unionids.forEach((unionid, index) => {
        let published = false;
        const msgId = uuidV1();
        const orderId = index + 1;
        const expiration = delayTime - new Date().getTime();
        const msgData = {
          taskId,
          msgId,
          orderId,
          unionid,
          templateId,
          color,
          url: url || (urls && urls[index]),
          data: data || dataList[index],
          miniprogram: miniprogram
            ? {
                appid,
                pagepath: pagepath || pagepaths[index],
              }
            : {},
          wechatAccount: ctx.wechatAccount,
          messageCallbackUrl,
        };
        published = isDelay
          ? this.publishService.sendToDelayMessageQueue(msgData, expiration)
          : this.publishService.sendToMessageQueue(msgData);
        const temp = published ? resp.succeed : resp.failed;
        temp.push({ unionid, msgId });
      });
      resp.taskId = taskId;
      return resp;
    } catch (err) {
      ctx.logger.error(err);
      ctx.error({
        ...TEMPLATE_MESSAGE_WRITE_MQ_ERROR,
        error: err.message,
      });
    }
  }
}
