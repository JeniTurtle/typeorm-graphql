import { Application } from 'egg';

export default (_app: Application) => {
  return {
    WECHAT_API_ERROR: {
      code: 700,
      msg: '微信API调用异常',
    },
    INVAILD_IDENTITY_ID_ERROR: {
      code: 701,
      msg: '无效的身份ID',
    },
    GET_ACCESS_TOKEN_PARAMS_ERROR: {
      code: 702,
      msg: 'accessToken获取参数不合法',
    },
    CREATE_ACCOUNT_ERROR: {
      code: 703,
      msg: '新增微信账户失败',
    },
    NOT_FOUND_WECHAT_ACCOUNT_ERROR: {
      code: 704,
      msg: '找不到微信账户信息',
    },
    GET_WECHAT_USER_FAILED_ERROR: {
      code: 705,
      msg: '获取微信用户信息失败',
    },
  };
};
