import { Index } from 'typeorm';
import { BaseModel, Model, StringField, ManyToOne, EnumField, TextField } from 'egg-typeorm-graphql';
import { WxAccount } from './account';
import { WxMessageTask } from './messageTask';

export enum WxTmPushStatus {
  DEFAULT = 0,
  PUSH_SUCCESS = 1,
  PUSH_FAILED = 2,
  RECEIVE_SUCCESS = 3,
  RECEIVE_FAILED = 4,
}

@Model({ database: 'accountDB' })
export class WxTemplateMessage extends BaseModel {
  @Index()
  @StringField({ maxLength: 256, comment: '微信模板消息ID', nullable: true })
  msgId?: string;

  @Index()
  @StringField({ maxLength: 256, comment: '临时生成的msgId', nullable: true })
  tempMsgId?: string;

  @StringField({ maxLength: 128, comment: '微信用户openid', nullable: true })
  openid: string;

  @StringField({ maxLength: 128, comment: '微信用户unionid', nullable: true })
  unionid: string;

  @StringField({ maxLength: 128, comment: '微信模板消息ID' })
  templateId: string;

  @StringField({ maxLength: 512, comment: '消息跳转web地址', nullable: true })
  url?: string;

  @StringField({ maxLength: 64, comment: '模板内容字体颜色', nullable: true })
  color?: string;

  @StringField({ maxLength: 128, comment: '跳转的微信小程序appId', nullable: true })
  miniprogramAppId?: string;

  @StringField({ maxLength: 512, comment: '跳转的微信小程序地址', nullable: true })
  miniprogramPagepath?: string;

  @TextField({ comment: '小程序模板消息内容，json字符串' })
  data: string;

  @ManyToOne(
    _type => WxAccount,
    wxAccount => wxAccount.wxTemplateMessage,
    {
      comment: '执行者',
    },
  )
  executor: WxAccount;
  executorId: string;

  @ManyToOne(
    _type => WxMessageTask,
    wxMessageTask => wxMessageTask.wxTemplateMessage,
    {
      comment: '所属任务，用来统计属于哪次操作',
    },
  )
  messageTask: WxAccount;
  messageTaskId: string;

  @EnumField('WxTmPushStatus', WxTmPushStatus, {
    default: WxTmPushStatus.DEFAULT,
    comment: '消息状态，1推送成功，2推送失败，3接收成功，4接收失败，0其他',
  })
  status: WxTmPushStatus;

  @TextField({ comment: '推送失败原因', nullable: true })
  failReason?: string;
}
