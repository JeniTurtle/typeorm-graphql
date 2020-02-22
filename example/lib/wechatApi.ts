import { Application } from 'egg';
import * as WechatApi from 'co-wechat-api';
import * as JSONbig from 'json-bigint';
import * as liburl from 'url';
import * as httpx from 'httpx';

interface IAccessToken {
  accessToken: string;
  expireTime: number;
}

export const request = async (wechatApi, url: string, opts: any, retry = 3) => {
  const JSONCtlCharsMap = {
    '"': '\\"', // \u0022
    '\\': '\\', // \u005c
    '\b': '\\b', // \u0008
    '\f': '\\f', // \u000c
    '\n': '\\n', // \u000a
    '\r': '\\r', // \u000d
    '\t': '\\t', // \u0009
  };
  const JSONCtlCharsRE = /[\u0000-\u001F\u005C]/g;
  const _replaceOneChar = c => JSONCtlCharsMap[c] || '\\u' + (c.charCodeAt(0) + 0x10000).toString(16).substr(1);
  const options: any = {};
  Object.assign(options, wechatApi.defaults);
  opts || (opts = {});
  Object.keys(opts).forEach(key => {
    if (key !== 'headers') {
      options[key] = opts[key];
    } else {
      if (opts.headers) {
        options.headers = options.headers || {};
        Object.assign(options.headers, opts.headers);
      }
    }
  });
  const res: any = await httpx.request(url, options);
  if (res.statusCode < 200 || res.statusCode > 204) {
    const err = new Error(`url: ${url}, status code: ${res.statusCode}`);
    err.name = 'WeChatAPIError';
    throw err;
  }

  const buffer = await httpx.read(res, 'utf8');
  const contentType = res.headers['content-type'] || '';
  if (contentType.indexOf('application/json') !== -1 || contentType.indexOf('text/plain') !== -1) {
    let data;
    const origin = buffer.toString();
    try {
      data = JSONbig.parse(origin.replace(JSONCtlCharsRE, _replaceOneChar));
    } catch (ex) {
      const err = new Error('JSON.parse error. buffer is ' + origin);
      err.name = 'WeChatAPIError';
      throw err;
    }
    if (data && data.errcode) {
      const err: any = new Error(data.errmsg);
      err.name = 'WeChatAPIError';
      err.code = data.errcode;

      if ((err.code === 40001 || err.code === 42001) && retry > 0 && !wechatApi.tokenFromCustom) {
        // 销毁已过期的token
        await wechatApi.saveToken(null);
        const token = await wechatApi.getAccessToken();
        const urlobj = liburl.parse(url, true);

        if (urlobj.query && urlobj.query.access_token) {
          urlobj.query.access_token = token.accessToken;
          delete urlobj.search;
        }
        return wechatApi.request(liburl.format(urlobj), opts, retry - 1);
      }
      throw err;
    }
    return data;
  }
  return buffer;
};

export default (appId: string, appSecret: string, app: Application) => {
  const WECHAT_ACCESS_TOKEN = `${appId}_wechat_access_token`;
  const prodk12NodeServer = `${app.config.customs.prodHost}/api/v2/wechat/token`;

  if (!appId || !appSecret) {
    app.logger.error("[egg-wechat-api] must set `appId` and `appSecret` in plugin's config.");
    return null;
  }

  if (!app.redis) {
    app.logger.error('[egg-wechat-api] redis is ready ?');
    return null;
  }

  const adapter = app.redis;

  async function getTicketToken(type) {
    const raw = await adapter.get(`${appId}_wechat_${type}`);
    return JSON.parse(raw || '{}');
  }

  async function saveTicketToken(type, _ticketToken) {
    await adapter.set(`${appId}_wechat_${type}`, JSON.stringify(_ticketToken));
  }

  async function getAccessToken(): Promise<IAccessToken> {
    const content = await adapter.get(WECHAT_ACCESS_TOKEN);
    app.logger.info(content);
    return JSON.parse(content || '{}');
  }

  async function saveAccessToken(token) {
    // 传入null的话，不作处理
    if (!token) {
      return;
    }
    // 更新当前redis数据库
    await adapter.set(WECHAT_ACCESS_TOKEN, JSON.stringify(token));
    try {
      // 更新生产环境access_token
      await app.curl(prodk12NodeServer, {
        method: 'POST',
        dataType: 'json',
        data: {
          appId,
          token: token.accessToken,
          expired_at: token.expireTime,
        },
      });
    } catch (err) {
      app.logger.error(err);
    }
  }

  const api = new WechatApi(appId, appSecret, getAccessToken, saveAccessToken);
  api.registerTicketHandle(getTicketToken, saveTicketToken);

  /**
   * 获取微信公众号openid
   */
  api.getOpenid = async code => {
    const url = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${api.appid}&secret=${api.appsecret}&code=${code}&grant_type=authorization_code`;
    return request(api, url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
  };
  return api;
};
