import * as assert from 'assert';
import * as lodash from 'lodash';
import { Inject, Service } from 'typedi';
import { BaseConsumer } from 'egg-rabbitmq-plus';
import { WxTmPushStatus } from '@typeorm/account/entity/wechat/templateMessage';
import { WxMsgTaskProgress } from '@typeorm/account/entity/wechat/messageTask';
import PublishService from '@service/rabbitmq/publish';
import MessageTaskService from '@service/wechat/messageTask';
import TemplateMsgService from '@service/wechat/templateMessage';
import WechatUserService from '@service/wechat/wechatUser';
import K12nodeCallBackService from '@service/curl/k12node/callback';

@Service()
export default class TemplateMessageConsumer extends BaseConsumer {
  @Inject()
  private publishService: PublishService;

  @Inject()
  private templateMsgService: TemplateMsgService;

  @Inject()
  private messageTaskService: MessageTaskService;

  @Inject()
  private callBackService: K12nodeCallBackService;

  @Inject()
  private wechatUserService: WechatUserService;

  private wechatApi: any = null;

  // rabbitmq消费配置
  static get config() {
    return {
      // env: ['local'],  // 可选，默认为所有环境
      disable: false, // 是否不启用
      queue: 'message_queue',
      routingKey: 'wechat/message/template', // 不配置则监听队列所有消息
    };
  }

  private jsonParse(str: string) {
    try {
      return JSON.parse(str);
    } catch (err) {
      this.ctx.logger.error('json parse error: ' + str);
      return str;
    }
  }

  /**
   * 调用微信api发送模板消息
   * @param param0
   * @param execCount
   */
  private async sendWechatMessage(
    data: {
      openid: string;
      templateId: string;
      url?: string;
      color?: string;
      msgData: object;
      miniprogram?: {
        appid: string;
        pagepath: string;
      };
    },
    msgId: string,
    execCount: number = 1,
  ) {
    assert(this.wechatApi, '微信接口工具类未初始化');
    const retryNum = 3; // 失败重试次数设置为3
    const { openid, templateId, url, color, msgData, miniprogram } = data;
    try {
      return await this.wechatApi.sendTemplate(openid, templateId, url, color, msgData, miniprogram);
    } catch (err) {
      this.ctx.logger.error(`微信模板接口请求失败，[msgID：${msgId}] ${err.message}`);
      // 失败重试
      if (execCount < retryNum) {
        return await this.sendWechatMessage(data, msgId, execCount + 1);
      }
      throw err;
    }
  }

  /**
   * 推送成功后，触发回调
   * @param callbackUrl
   * @param data
   */
  private async messageCallback(callbackUrl: string, data: any, messageId: string) {
    this.ctx.logger.info(data);
    try {
      if (!callbackUrl) {
        throw new Error('未配置回调地址，已放入消息队列中');
      }
      const k12NodeServer = await this.app.serviceApis.k12NodeServer();
      const requestUrl = callbackUrl.indexOf('http') === 0 ? callbackUrl : k12NodeServer + callbackUrl;
      // 请求配置的回调地址
      const resp = await this.callBackService.templateMessageCallback(requestUrl, data);
      if (!resp || !resp.data) {
        throw new Error(`消息回调接口调用失败，msgId: ${messageId}; url: ${requestUrl}; data: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      this.ctx.logger.error(err);
      // 如果回调接口异常，丢到MQ中，调用服务自行消费。
      const isSend = this.publishService.sendToMessageCallbackQueue(data);
      this.ctx.logger.info('消息回调队列写入状态：', isSend);
      return false;
    }
    return true;
  }

  /**
   * 消息订阅，自动消费
   */
  async subscribe(data) {
    let content: any;
    const { app } = this.ctx;
    const { channel } = this.publishService.getMessageQueueInfo();
    try {
      content = JSON.parse(data.content.toString());
    } catch (err) {
      throw err;
    }
    const {
      taskId,
      msgId,
      unionid,
      templateId,
      url,
      color,
      data: msgData,
      miniprogram,
      messageCallbackUrl,
      wechatAccount: { id, appId, appSecret, wechatId },
    } = content;
    const redisTaskCountKey = `${taskId}_count`;
    const redisTaskSucceedKey = `${taskId}_succeed`;
    const redisTaskFailedKey = `${taskId}_failed`;
    const saveData: any = {
      tempMsgId: msgId,
      messageTaskId: taskId,
      executorId: id,
      templateId,
      unionid,
      url,
      color,
      data: JSON.stringify(msgData),
      miniprogramAppId: miniprogram.appid,
      miniprogramPagepath: miniprogram.pagepath,
      status: WxTmPushStatus.DEFAULT,
    };
    try {
      const wechatUserInfo = await this.wechatUserService.findOne({ unionid, wechatId });
      if (!wechatUserInfo) {
        throw new Error('该用户未关注当前学校的公众号');
      }
      saveData.openid = wechatUserInfo.openid;
      // 推送微信模板消息
      this.wechatApi = this.ctx.getWechatApi(appId, appSecret);
      const resp = await this.sendWechatMessage(
        {
          templateId,
          url,
          color,
          msgData,
          miniprogram,
          openid: saveData.openid,
        },
        msgId,
      );
      // 设置状态为成功
      saveData.status = WxTmPushStatus.PUSH_SUCCESS;
      saveData.msgId = String(resp.msgid);
      // 成功后，缓存成功结果到redis
      await app.redis.sadd(redisTaskSucceedKey, JSON.stringify(saveData));
      // 确认消费
      channel.ack(data);
    } catch (err) {
      this.ctx.logger.error(err);
      // 设置状态为失败
      saveData.status = WxTmPushStatus.PUSH_FAILED;
      // 添加失败原因
      saveData.failReason = err.message;
      // 失败后，缓存错误结果到redis
      await app.redis.sadd(redisTaskFailedKey, JSON.stringify(saveData));
      // 最后把推送失败的消息丢到死信交换机里，供后续操作处理
      channel.nack(data, false, false);
    } finally {
      // 不管成功失败，把redis任务数量减1
      const count = await app.redis.decr(redisTaskCountKey);
      try {
        // 把推送记录写入到数据库中
        await this.templateMsgService.create(saveData);
      } catch (err) {
        this.ctx.logger.error(err);
      }
      if (count <= 0) {
        // 读取redis缓存的处理结果
        let [succeedSet, failedSet]: [any, any] = await Promise.all([
          app.redis.smembers(redisTaskSucceedKey),
          app.redis.smembers(redisTaskFailedKey),
        ]);
        // 如果set只有一条数据，会返回string
        succeedSet = lodash.isArray(succeedSet)
          ? succeedSet.map(item => this.jsonParse(item))
          : succeedSet
          ? [this.jsonParse(succeedSet)]
          : [];
        failedSet = lodash.isArray(failedSet)
          ? failedSet.map(item => this.jsonParse(item))
          : failedSet
          ? [this.jsonParse(failedSet)]
          : [];
        const response = {
          taskId,
          succeed: succeedSet.map(item => item.tempMsgId || item),
          failed: failedSet.map(item => ({
            msgId: item.tempMsgId || item.msgId,
            errmsg: item.failReason || item.errmsg,
          })),
        };
        // 把处理结果发送给回调接口
        await this.messageCallback(messageCallbackUrl, response, msgId);
        // 删除redis缓存数据
        await Promise.all([
          app.redis.del(redisTaskCountKey),
          app.redis.del(redisTaskSucceedKey),
          app.redis.del(redisTaskFailedKey),
        ]);
        // 执行完成后，更新任务进度
        await this.messageTaskService.updateById(
          {
            progress: WxMsgTaskProgress.COMPLETE,
          },
          taskId,
        );
      }
    }
  }
}
