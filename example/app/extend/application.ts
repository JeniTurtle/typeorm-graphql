import * as jwtTool from 'jsonwebtoken';
import { Application } from 'egg';

const JWT = Symbol('Application#jwt');

export default {
  get sentry(this: Application) {
    return {
      captureException: (error: Error) => {
        this.messenger.sendToAgent('SentryCaptureException', {
          message: error.message,
          stack: error.stack,
        });
      },
    };
  },

  /**
   * 获取其他微服务地址
   */
  get serviceApis(this: Application) {
    const { k12NodeServer } = this.config.eureka.apps;
    return {
      k12NodeServer: async () => await this.eureka.getServiceByAppId(k12NodeServer.name),
    };
  },

  /**
   * JWT相关操作
   */
  get jwt(this: Application) {
    if (this[JWT]) {
      return this[JWT];
    }
    const { jwt } = this.config.authorize;
    this[JWT] = {
      sign: (payload: object, options: object = {}) => {
        return jwtTool.sign(payload, jwt.secret, {
          ...jwt.sign,
          ...options,
        });
      },

      verify: (token: string, options: object = {}) => {
        return jwtTool.verify(token, jwt.secret, {
          ...jwt.verify,
          ...options,
        });
      },

      decode: (token: string, options: object = {}) => {
        return jwtTool.decode(token, {
          ...jwt.decode,
          ...options,
        });
      },
    };
    return this[JWT];
  },
};
