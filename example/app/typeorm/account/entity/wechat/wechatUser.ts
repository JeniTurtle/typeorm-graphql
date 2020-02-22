import { Index } from 'typeorm';
import { BaseModel, Model, StringField, DateField, EnumField } from 'egg-typeorm-graphql';

export enum WxWechatUserSex {
  UNKNOWN = 0,
  MAN = 1,
  WOMAN = 2,
}

export enum WxWechatUserSubscribe {
  NO = 0,
  YES = 1,
}

@Model({ database: 'accountDB' })
export class WxWechatUser extends BaseModel {
  @Index()
  @StringField({ maxLength: 64, comment: '微信openid' })
  openid?: string;

  @Index()
  @StringField({ maxLength: 64, comment: '微信unionid' })
  unionid?: string;

  @StringField({ maxLength: 128, comment: '微信用户昵称', nullable: true })
  nickname?: string;

  @EnumField('WxWechatUserSex', WxWechatUserSex, {
    default: WxWechatUserSex.UNKNOWN,
    comment: '性别，0未知，1男，2女',
  })
  sex?: WxWechatUserSex;

  @StringField({ maxLength: 512, comment: '微信用户头像', nullable: true })
  headimgurl?: string;

  @EnumField('WxWechatUserSubscribe', WxWechatUserSubscribe, {
    default: WxWechatUserSubscribe.NO,
    comment: '是否关注，0未关注，1已关注',
  })
  subscribe?: WxWechatUserSubscribe;

  @DateField({ comment: '最后一次关注时间', nullable: true })
  subscribeTime?: Date;

  @StringField({ maxLength: 128, comment: '微信公众号账号', nullable: true })
  wechatId?: string;
}
