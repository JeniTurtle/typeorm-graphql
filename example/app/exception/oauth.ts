import { Application } from 'egg';

export default (_app: Application) => {
  return {
    INVAILD_SIGN_ERROR: {
      code: 1101,
      msg: '无效的签名',
    },
    SIGNATURE_EXPIRED_ERROR: {
      code: 1102,
      msg: '签名已过期',
    },
    INVAILD_APP_ACCOUNT_ERROR: {
      code: 1103,
      msg: '无效的应用账户',
    },
    NO_PERMISSION_FOR_SCHOOL_ERROR: {
      code: 1104,
      msg: '无此学校权限',
    },
    NOT_INTRODUCED_APPID_OR_SECRET_ERROR: {
      code: 1105,
      msg: '未传入有效的appId和appSecret',
    },
    TOKEN_UNAUTHORIED_ERROR: {
      code: 1106,
      msg: '授权认证失败',
    },
    ACCOUNT_DISABLED_ERROR: {
      code: 1107,
      msg: '账户已被禁用',
    },
  };
};
