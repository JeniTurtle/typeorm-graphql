import { Service } from 'typedi';
import BaseCurlService from '@service/curl/base';

@Service()
export default class K12nodeCallBackService extends BaseCurlService {
  /**
   * 微信模板消息推送结果回调
   * @param requestUrl
   * @param data
   */
  async templateMessageCallback(requestUrl: string, data: any) {
    return await this.post(requestUrl, {
      data,
    });
  }
}
