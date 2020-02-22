import * as md5 from 'js-md5';
import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { ThirdPartyAuthStatus, ThirdPartyAuth } from '@typeorm/account/entity/auth/thirdPartyAuth';

@Service()
export default class OAuthService extends BaseService<ThirdPartyAuth> {
  constructor(@InjectRepository(ThirdPartyAuth) readonly repository: Repository<ThirdPartyAuth>) {
    super(ThirdPartyAuth, repository);
  }

  /**
   * 生成accessToken校验签名
   * @param param0
   */
  generateSign({ appId, appSecret, timestamp }: { appId: string; appSecret: string; timestamp: string }) {
    const reverseTime = timestamp
      .split('')
      .reverse()
      .join('');
    this.ctx.logger.info(appId, appSecret, timestamp);
    return md5(appId + appSecret + reverseTime);
  }

  /**
   * 效验数字签名
   * @param param0
   */
  validateSign({
    appId,
    appSecret,
    timestamp,
    sign,
  }: {
    appId: string;
    appSecret: string;
    timestamp: number;
    sign: string;
  }) {
    const { INVAILD_SIGN_ERROR, SIGNATURE_EXPIRED_ERROR } = this.app.exception.oauth;
    const newSign = this.generateSign({ appId, appSecret, timestamp: String(timestamp) });
    this.ctx.logger.info(newSign, sign);
    if (newSign !== sign) {
      this.ctx.error(INVAILD_SIGN_ERROR);
    }
    if (new Date().getTime() - timestamp > 60 * 1000) {
      this.ctx.error(SIGNATURE_EXPIRED_ERROR);
    }
    return true;
  }

  async validateOAuth({
    school,
    appId,
    appSecret,
    timestamp,
    sign,
  }: {
    school: number;
    appId: string;
    appSecret: string;
    timestamp: number;
    sign: string;
  }): Promise<ThirdPartyAuth | never> {
    const {
      ACCOUNT_DISABLED_ERROR,
      INVAILD_APP_ACCOUNT_ERROR,
      NO_PERMISSION_FOR_SCHOOL_ERROR,
    } = this.app.exception.oauth;
    this.validateSign({ sign, appId, appSecret, timestamp });
    const thirdApp = await this.findOne({
      appId,
      appSecret,
    });
    if (!thirdApp) {
      this.ctx.error(INVAILD_APP_ACCOUNT_ERROR);
    }
    if (thirdApp.status !== ThirdPartyAuthStatus.NORMAL) {
      this.ctx.error(ACCOUNT_DISABLED_ERROR);
    }
    const schools = thirdApp.schools?.split(',').map(Number);
    if (!schools || !schools.includes(school)) {
      this.ctx.error(NO_PERMISSION_FOR_SCHOOL_ERROR);
    }
    return thirdApp;
  }

  /**
   * 授权认证生成的临时key
   */
  generateTemporaryToken() {
    // 获取当前的时间戳
    const timestamp = String(new Date().getTime());
    // 时间戳倒序
    const reverseTimestamp = timestamp
      .split('')
      .reverse()
      .join('');
    return this.ctx.helper.crypto.encrypt(reverseTimestamp);
  }

  /**
   * 效验认证生成的临时key
   * @param token
   */
  validateTemporaryToken(token: string): boolean {
    const { app, helper } = this.ctx;
    const { GET_ACCESS_TOKEN_PARAMS_ERROR } = app.exception.wechat;
    // 获取当前分钟的时间戳
    const timestamp = String(new Date().getTime());
    // 解码传入临时token，并倒序
    const decodeTime = helper.crypto
      .decrypt(token)
      .split('')
      .reverse()
      .join('');
    // 判断传入的token是否合法
    if (Number(timestamp) - Number(decodeTime) > 60 * 1000) {
      this.ctx.error(GET_ACCESS_TOKEN_PARAMS_ERROR);
    }
    return true;
  }
}
