import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { WxWechatUser } from '@typeorm/account/entity/wechat/wechatUser';
import WxAccountService from '@service/wechat/account';

@Service()
export default class WxWechatUserService extends BaseService<WxWechatUser> {
  @Inject()
  protected readonly accountService: WxAccountService;

  constructor(@InjectRepository(WxWechatUser) readonly repository: Repository<WxWechatUser>) {
    super(WxWechatUser, repository);
  }

  /**
   * 拉取所有微信公众号用户列表
   */
  async getFollowers() {
    const openidList: Array<Array<string | null>> = [];
    let nextOpenid: any = null;
    do {
      try {
        const { data, next_openid } = await this.ctx.wechatApi.getFollowers(nextOpenid);
        nextOpenid = next_openid;
        if (data) {
          openidList.push(data.openid);
        }
      } catch (err) {
        this.ctx.logger.error(err);
      }
    } while (nextOpenid);
    return openidList;
  }

  /**
   * 批量更新微信用户信息
   * @param openidList
   */
  async batchUpdateWechatUser(wechatId: string, openidList: string[]) {
    try {
      const { user_info_list } = await this.ctx.wechatApi.batchGetUsers(openidList);
      if (!user_info_list || user_info_list.length === 0) {
        const { GET_WECHAT_USER_FAILED_ERROR } = this.ctx.app.exception.template;
        this.ctx.error(GET_WECHAT_USER_FAILED_ERROR);
      }
      // 查询数据库中的微信用户
      const wechatUsers = await this.find({
        where: { openid_in: openidList },
        fields: ['subscribe', 'unionid', 'openid'],
      });
      // 遍历获取的用户信息
      user_info_list.forEach(async userinfo => {
        try {
          const user = wechatUsers.find(user => user.openid === userinfo.openid);
          const baseData = {
            nickname: userinfo.nickname,
            sex: userinfo.sex,
            headimgurl: userinfo.headimgurl,
            subscribe: userinfo.subscribe,
            subscribeTime: new Date(userinfo.subscribe_time * 1000),
          };
          // 数据库里没有该用户，就插入新纪录
          if (!user) {
            await this.create({
              ...baseData,
              wechatId,
              unionid: userinfo.unionid || '',
            });
            return;
          }
          // 如果数据库中状态有变化，则更新数据库
          if (user.subscribe !== userinfo.subscribe) {
            await this.update(
              { ...baseData },
              {
                openid: user.openid,
              },
            );
          }
        } catch (err) {
          this.ctx.logger.error(err);
        }
      });
    } catch (err) {
      this.ctx.logger.error(err);
    }
  }

  /**
   * 添加或更新微信公众号用户
   * @param wechatId  微信公众号账号
   * @param openId  用户openid
   */
  async registerWechatUser(wechatId: string, openId: string) {
    try {
      const wechatAccount = await this.accountService.getWechatApi(wechatId);
      // 获取微信用户信息
      const userinfo = await wechatAccount.getUser(openId);
      const { openid, unionid, subscribe, nickname, sex, headimgurl, subscribe_time: subscribeTime } = userinfo;
      const where = { openid };
      const wechatUser = await this.findOne({ ...where }, ['subscribe', 'unionid', 'openid', 'nickname']);
      const baseData = {
        nickname,
        sex,
        headimgurl,
        subscribe,
        subscribeTime: new Date(subscribeTime * 1000),
      };
      if (!wechatUser) {
        return await this.create({
          ...baseData,
          wechatId,
          unionid: unionid || '',
        });
      }
      // 如果数据库中状态有变化，则更新数据库
      if (wechatUser.subscribe !== subscribe || wechatUser.nickname !== nickname) {
        return await this.update({ ...baseData }, { ...where });
      }
    } catch (err) {
      this.ctx.logger.error(err);
    }
  }
}
