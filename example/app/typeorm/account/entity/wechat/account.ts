import { Index } from 'typeorm';
import { BaseModel, Model, StringField, ManyToOne, OneToOne } from 'egg-typeorm-graphql';
import { Organization } from '../auth/organization';
import { WxAccountConfig } from './accountConfig';

@Model({ database: 'accountDB' })
export class WxAccount extends BaseModel {
  @OneToOne(_type => WxAccountConfig, {
    comment: '账户配置',
  })
  config: WxAccountConfig;
  configId: string;

  @StringField({ maxLength: 64, comment: '账户名称' })
  accountName: string;

  @Index()
  @StringField({ maxLength: 64, comment: '微信AppId' })
  appId: string;

  @StringField({ maxLength: 128, comment: '微信AppSecret' })
  appSecret: string;

  @StringField({ maxLength: 128, comment: '微信号', nullable: true })
  wechatId: string;

  @Index()
  @StringField({ maxLength: 128, comment: '下发的身份标识' })
  identityId: string;

  @ManyToOne(
    _type => Organization,
    origanization => origanization.wxAccount,
    {
      nullable: true,
      comment: '所属机构',
    },
  )
  organization?: Organization;
  organizationId?: string;
}
