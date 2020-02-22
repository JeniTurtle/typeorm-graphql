import { BaseModel, Model, StringField, TextField } from 'egg-typeorm-graphql';

@Model({ database: 'accountDB' })
export class WxAccountConfig extends BaseModel {
  @StringField({ maxLength: 128, comment: '微信号' })
  wechatId: string;

  @StringField({ maxLength: 128, comment: '微信支付子商户号', nullable: true })
  subMchId: string;

  @TextField({ comment: '关注回复', nullable: true })
  followReply: string;

  @StringField({ maxLength: 512, comment: '消息回调地址', nullable: true })
  messageCallbackUrl: string;
}
