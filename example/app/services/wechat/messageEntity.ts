import { Service, Inject } from 'typedi';
import { EggBaseService } from 'egg-typeorm-graphql';
import AccountConfigService from '@service/wechat/accountConfig';

@Service()
export default class WxMessageEntityService extends EggBaseService {
  @Inject()
  readonly accountConfigService: AccountConfigService;

  /**
   * 返回xml消息格式
   * @param toUser
   * @param fromUser
   * @param content
   */
  private renderXMLMessage(toUser: string, fromUser: string, content: string) {
    const currentTime = Math.floor(new Date().getTime() / 1000);
    const message = `
      <xml>
        <ToUserName><![CDATA[${toUser}]]></ToUserName>
        <FromUserName><![CDATA[${fromUser}]]></FromUserName>
        <CreateTime>${currentTime}</CreateTime>
        ${content}
      </xml>
    `;
    this.ctx.set('Content-Type', 'text/xml');
    this.ctx.body = message;
  }

  /**
   * 返回文本类型消息
   * @param toUser
   * @param fromUser
   * @param text
   */
  replyTextMessage(toUser: string, fromUser: string, text: string) {
    const content = `
      <MsgType><![CDATA[text]]></MsgType>
      <Content><![CDATA[${text}]]></Content>
    `;
    this.renderXMLMessage(toUser, fromUser, content);
  }

  /**
   * 将收到的用户信息转发给微信客服系统
   * @param toUser
   * @param fromUser
   */
  transferCustomerService(toUser: string, fromUser: string) {
    const content = `
      <MsgType><![CDATA[transfer_customer_service]]></MsgType>
    `;
    this.renderXMLMessage(toUser, fromUser, content);
  }

  /**
   * 公众号关注回复
   * @param toUser
   * @param fromUser
   */
  async followReply(wechatId: string, toUser: string, fromUser: string) {
    const accountConfig = await this.accountConfigService.findOne({
      wechatId,
    });
    if (accountConfig && accountConfig.followReply) {
      this.replyTextMessage(toUser, fromUser, accountConfig.followReply);
    }
  }
}
