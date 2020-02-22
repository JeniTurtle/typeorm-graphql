import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { WxTemplateMessage, WxTmPushStatus } from '@typeorm/account/entity/wechat/templateMessage';

@Service()
export default class WxTemplateMessageService extends BaseService<WxTemplateMessage> {
  constructor(@InjectRepository(WxTemplateMessage) readonly repository: Repository<WxTemplateMessage>) {
    super(WxTemplateMessage, repository);
  }

  // 处理模板消息事件回调
  async eventHandle(msgId: string, status: string) {
    try {
      if (status === 'success') {
        await this.update(
          {
            status: WxTmPushStatus.RECEIVE_SUCCESS,
          },
          {
            msgId,
          },
        );
      } else {
        await this.update(
          {
            failReason: status,
            status: WxTmPushStatus.RECEIVE_FAILED,
          },
          {
            msgId,
          },
        );
      }
    } catch (err) {
      this.ctx.logger.error(err);
    }
  }
}
