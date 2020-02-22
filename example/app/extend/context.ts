import * as assert from 'assert';
import { Context } from 'egg';
import createWechatApi from '@lib/wechatApi';
import Exception from '@lib/exception';

const wechatApiMap = new Map<string, any>();

export interface IResponseJsonFormat {
  code?: number;
  data: any;
  msg?: string;
}

export interface IResponseErrorFormat {
  code?: number;
  error?: string;
  msg?: string;
}

export default {
  platform: {
    id: '',
  },

  /**
   * 输出json格式数据
   * @param resp
   */
  success(this: Context, resp: IResponseJsonFormat) {
    const { code = 100, data, msg = '请求成功' } = resp;
    this.status = 200;
    return (this.response.body = {
      code,
      msg,
      data,
    });
  },

  /**
   * 返回错误格式数据
   * @param this
   * @param code
   * @param msg
   * @param error
   * @param status
   */
  exception(this: Context, code: number, msg: string, error: string, status: number = 200) {
    this.status = status;
    return (this.response.body = {
      code,
      msg,
      error,
    });
  },

  /**
   * 抛出错误
   * @param resp
   * @param status
   */
  error(this: Context, resp: IResponseErrorFormat, status: number = 200): never {
    const { DEFAULT_ERROR } = this.app.exception.usually;
    const { code, msg } = DEFAULT_ERROR;
    throw new Exception({
      code: resp.code || code,
      msg: resp.msg || msg,
      error: resp.error,
      status,
    });
  },

  /**
   * 从上下文中直接获取wechatApi实例，如果存在，会从缓存中取
   */
  get wechatApi(this: Context) {
    assert(this.wechatAccount, '获取wechatApi实例，必须先走wechatTokenValidate中间件');
    const { appId, appSecret } = this.wechatAccount;
    this.logger.info(this.wechatAccount);
    if (wechatApiMap.has(appId)) {
      return wechatApiMap.get(appId);
    }
    const wechatApi = createWechatApi(appId, appSecret, this.app);
    wechatApiMap.set(appId, wechatApi);
    return wechatApi;
  },

  /**
   * 给上下文指定appid和appSecret，并获取wechatApi实例
   * @param this
   * @param appId
   * @param appSecret
   */
  getWechatApi(this: Context, appId: string, appSecret: string) {
    this.wechatAccount = {
      appId,
      appSecret,
    };
    return this.wechatApi;
  },
};
