import * as CryptoJs from 'crypto-js';
import { Context } from 'egg';
import { HiddenAll, Post, Get, Controller, IgnoreJwtAll, Summary } from 'egg-shell-plus';
import { Inject } from 'typedi';
import WxTemplateMessageService from '@service/wechat/templateMessage';
import WxMessageEntityService from '@service/wechat/messageEntity';
import WxWechatUserService from '@service/wechat/wechatUser';

@HiddenAll
@IgnoreJwtAll
@Controller('微信接收消息、事件推送')
export default class Server {
  @Inject()
  readonly wechatUserService: WxWechatUserService;

  @Inject()
  readonly messageService: WxTemplateMessageService;

  @Inject()
  readonly messageEntityService: WxMessageEntityService;

  /**
   * 微信服务器签名效验
   * @param ctx
   */
  private checkSignature(ctx: Context): string | boolean {
    const token = ctx.app.config.wechat.server.globalToken;
    const { echostr, signature = '', timestamp = '', nonce = '' } = ctx.query;
    const str = [token, timestamp, nonce].sort().join('');
    const encodeStr = CryptoJs.SHA1(str).toString();
    return encodeStr === signature ? echostr : false;
  }

  @Get('/reply/:wechatId')
  @Summary('微信服务器token效验接口')
  validate(ctx: Context) {
    ctx.body = this.checkSignature(ctx) || 'error';
  }

  @Post('/reply/:wechatId')
  @Summary('微信接收消息、事件推送接口')
  async event(ctx: Context) {
    const { body } = ctx.request;
    const wechatId = ctx.params.wechatId;
    // 打印请求内容
    ctx.logger.info(body);
    // 签名效验，判断是否是来自微信的有效请求
    if (this.checkSignature(ctx) === false) {
      ctx.logger.error('无效的用户签名');
      return 'Fuck you!';
    }
    const userOpenId = body.FromUserName._cdata;
    // 事件处理
    if (body.MsgType && body.MsgType._cdata === 'event') {
      const eventName = body.Event!._cdata;

      switch (eventName) {
        // 模板消息推送事件
        case 'TEMPLATESENDJOBFINISH':
          const msgId = body.MsgID!._text;
          const status = body.Status!._cdata;
          // 微信有个智障问题，接收推送的时间要早于推送完消息处理的时间，所以这里要做一下延迟。。。
          setTimeout(async () => {
            await this.messageService.eventHandle(msgId, status);
          }, 1000);
          break;
        // 用户关注事件
        case 'subscribe':
          // 往数据库增加或更新微信用户信息
          this.wechatUserService.registerWechatUser(wechatId, userOpenId);
          // 返回关注后要回复的文本消息
          await this.messageEntityService.followReply(wechatId, userOpenId, wechatId);
          return;
        // 用户取消关注事件
        case 'unsubscribe':
        // 用户点击自定义菜单事件
        case 'CLICK':
          // 往数据库增加或更新微信用户信息
          this.wechatUserService.registerWechatUser(wechatId, userOpenId);
          break;
        default:
      }
      ctx.body = 'success';
      return;
    }
    // 消息处理，全部转接到客服系统
    this.messageEntityService.transferCustomerService(userOpenId, wechatId);
    return;
  }
}
