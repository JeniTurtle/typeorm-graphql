import { BaseModel, Model, ManyToOne, EnumField, IntField, TextField, DateField } from 'egg-typeorm-graphql';
import { WxAccount } from './account';

export enum WxMsgTaskType {
  DEFAULT = 0,
  TEMPLATE = 1,
}

export enum WxMsgIsDelay {
  YES = 1,
  NO = 0,
}

export enum WxMsgTaskProgress {
  READY = 0,
  COMPLETE = 1,
}

@Model({ database: 'accountDB' })
export class WxMessageTask extends BaseModel {
  @IntField({ comment: '批处理数量' })
  batchCount: number;

  @TextField({ comment: '执行的相关参数，json字符串' })
  params: string;

  @ManyToOne(
    _type => WxAccount,
    wxAccount => wxAccount.wxMessageTask,
    {
      comment: '执行者',
    },
  )
  executor: WxAccount;
  executorId: string;

  @EnumField('WxMsgTaskType', WxMsgTaskType, {
    default: WxMsgTaskType.DEFAULT,
    comment: '任务类型，1模板消息，0其他',
  })
  type: WxMsgTaskType;

  @EnumField('WxMsgIsDelay', WxMsgIsDelay, {
    default: WxMsgIsDelay.NO,
    comment: '是否延迟执行，1是，0否',
  })
  isDelay: WxMsgIsDelay;

  @DateField({ comment: '计划执行时间', nullable: true })
  planTime?: Date;

  @EnumField('WxMsgTaskProgress', WxMsgTaskProgress, {
    default: WxMsgTaskProgress.READY,
    comment: '任务进度，0开始执行；1执行完成',
  })
  progress: WxMsgTaskProgress;
}
