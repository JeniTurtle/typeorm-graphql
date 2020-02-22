import { Application } from 'egg';

export default (_app: Application) => {
  return {
    DEFAULT_ERROR: {
      code: 101,
      msg: '系统异常',
    },
    PARAM_VALIDATE_ERROR: {
      code: 102,
      msg: '参数格式效验失败',
    },
    SYSTEM_VALIDATE_ERROR: {
      code: 103,
      msg: '系统操作效验失败',
    },
    API_REQUEST_FAILED_ERROR: {
      code: 104,
      msg: '接口请求失败',
    },
  };
};
