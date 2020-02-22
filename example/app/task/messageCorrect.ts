import * as is from 'is-type-of';
import { Inject } from 'typedi';
import { SingleProgressTask } from '@lib/singleProgressTask';
import { WxMsgTaskProgress } from '@typeorm/account/entity/wechat/messageTask';
import MessageTaskService from '@service/wechat/messageTask';
import TemplateMessageService from '@service/wechat/templateMessage';

export default class MessageCorrect extends SingleProgressTask {
  @Inject()
  private messageTaskService: MessageTaskService;

  @Inject()
  private messageService: TemplateMessageService;

  disable = true;

  private jsonParse(str: string) {
    try {
      return JSON.parse(str);
    } catch (err) {
      this.app.logger.error('json parse error: ' + str);
      return str;
    }
  }

  async task() {
    const { redis } = this.app;
    const messageTasks = await this.messageTaskService.find({
      fields: ['id', 'createdAt'],
      where: {
        progress: 0,
      },
    });
    messageTasks.forEach(async item => {
      const redisTaskCountKey = `${item.id}_count`;
      const redisTaskSucceedKey = `${item.id}_succeed`;
      const redisTaskFailedKey = `${item.id}_failed`;

      try {
        // 判断执行时间是否超过30分钟
        if (new Date().getTime() - new Date(item.createdAt).getTime() < 30 * 60 * 1000) {
          return;
        }
        // 清空redis数量缓存
        await redis.del(redisTaskCountKey);
        // 读取redis缓存的处理结果
        let [succeedSet, failedSet]: [any, any] = await Promise.all([
          redis.smembers(redisTaskSucceedKey),
          redis.smembers(redisTaskFailedKey),
        ]);
        // 如果set只有一条数据，会返回string
        succeedSet = is.array(succeedSet)
          ? succeedSet.map(item => this.jsonParse(item))
          : succeedSet
          ? [this.jsonParse(succeedSet)]
          : [];
        failedSet = is.array(failedSet)
          ? failedSet.map(item => this.jsonParse(item))
          : failedSet
          ? [this.jsonParse(failedSet)]
          : [];
        try {
          const allSet = [].concat(succeedSet, failedSet) as any[];
          const msgIds = allSet.map(item => item.tempMsgId).filter(id => !!id);
          const existings = await this.messageService.find({
            fields: ['tempMsgId'],
            where: {
              tempMsgId_in: msgIds,
            },
          });
          const noSaveIds = msgIds.filter(msgId => !existings.find(item => item.tempMsgId === msgId));
          const saveData = allSet.filter(async item => is.object(item) && noSaveIds.indexOf(item.tempMsgId) >= 0);
          await this.messageService.createMany(saveData);
        } catch (err) {
          this.app.logger.error(err);
        }
        // const response = {
        //   taskId: item.id,
        //   succeed: succeedSet.map(item => item.tempMsgId || item),
        //   failed: failedSet.map(item => item.tempMsgId || item),
        // };
        // 把处理结果发送给回调接口
        // await this.messageCallback(messageCallbackUrl, response, msgId);
        // 删除redis缓存数据
        await Promise.all([
          redis.del(redisTaskCountKey),
          redis.del(redisTaskSucceedKey),
          redis.del(redisTaskFailedKey),
        ]);
        // 执行完成后，更新任务进度
        await this.messageTaskService.updateById(
          {
            progress: WxMsgTaskProgress.COMPLETE,
          },
          item.id,
        );
      } catch (err) {
        this.app.logger.error(err);
      }
    });
  }
}
