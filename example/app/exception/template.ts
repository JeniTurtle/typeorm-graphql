import { Application } from 'egg';

export default (_app: Application) => {
  return {
    TEMPLATE_MESSAGE_WRITE_MQ_ERROR: {
      code: 801,
      msg: '模板消息写入消息队列失败',
    },
    TEMPLATE_MESSAGE_PUSH_FAILED_ERROR: {
      code: 802,
      msg: '模板消息推送失败',
    },
    TEMPLATE_LIBRARY_NAME_REPEAT_ERROR: {
      code: 803,
      msg: '消息模板名称已存在',
    },
    TEMPLATE_LIBRARY_ID_REPEAT_ERROR: {
      code: 804,
      msg: '消息模板ID已存在',
    },
    TEMPLATE_LIBRARY_ALREADY_USERD_ERROR: {
      code: 805,
      msg: '该模板已被使用，请取消设置后再操作',
    },
    TEMPLATE_LIBRARY_NOT_EXISTS_ERROR: {
      code: 806,
      msg: '该模板不存在',
    },
  };
};
