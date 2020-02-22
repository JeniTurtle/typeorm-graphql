import { BaseModel, Model, StringField, EnumField, IntField } from 'egg-typeorm-graphql';

export enum ThirdPartyAuthStatus {
  NORMAL = 0,
  DISABLE = 1,
}

@Model({ database: 'accountDB' })
export class ThirdPartyAuth extends BaseModel {
  @StringField({ maxLength: 64, comment: '第三方应用名称' })
  name: string;

  @StringField({ maxLength: 128, comment: '第三方应用ID' })
  appId: string;

  @StringField({ maxLength: 128, comment: '第三方应用密钥' })
  appSecret: string;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @StringField({ maxLength: 1024, comment: '绑定的学校ID列表', nullable: true })
  schools?: string;

  @IntField({ comment: 'accessToken有效时间，单位（秒）', nullable: true })
  tokenExpireTime?: number;

  @EnumField('ThirdPartyAuthStatus', ThirdPartyAuthStatus, {
    default: ThirdPartyAuthStatus.NORMAL,
    comment: '第三方应用状态，0正常、1禁用',
  })
  status: ThirdPartyAuthStatus;
}
