import { Service } from 'typedi';
import { EggBaseService } from 'egg-typeorm-graphql';

@Service()
export default class BaseCurlService extends EggBaseService {
  prefix: string = '';

  private async curl(url: string, opts: any = {}) {
    const options: any = {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      method: 'GET',
      dataType: 'json',
      ...opts,
    };
    const { status, data } = await this.app.curl(url, options);
    if (status < 200 || status > 204) {
      const { API_REQUEST_FAILED_ERROR } = this.app.exception.usually;
      this.ctx.logger.error(`${url} request failed: `, opts.data, data);
      this.ctx.error(API_REQUEST_FAILED_ERROR);
    }
    return data;
  }

  async post(url: string, opts: any = {}) {
    return await this.curl(url, {
      ...opts,
      method: 'POST',
    });
  }

  async get(url: string, opts: any = {}) {
    return await this.curl(url, {
      ...opts,
      method: 'GET',
    });
  }

  async put(url: string, opts: any = {}) {
    return await this.curl(url, {
      ...opts,
      method: 'PUT',
    });
  }

  async delete(url: string, opts: any = {}) {
    return await this.curl(url, {
      ...opts,
      method: 'DELETE',
    });
  }
}
