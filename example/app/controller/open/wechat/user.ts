import * as Joi from 'joi';
import { Context } from 'egg';
import { Post, Get, Put, BeforeAll, Controller, IgnoreJwtAll, Summary } from 'egg-shell-plus';
import { Inject } from 'typedi';
import msgTokenValidate, { ParametersWithToken } from '@middleware/routerMiddleware/msgTokenValidate';
import WxWechatUserService from '@service/wechat/wechatUser';

@IgnoreJwtAll
@Controller('微信公众号用户相关接口')
@BeforeAll(msgTokenValidate)
export default class User {
  @Inject()
  private wechatUserService: WxWechatUserService;

  @Get()
  @Summary('全量拉取所有微信公众号粉丝信息')
  @ParametersWithToken()
  async fullWechatUsers(ctx: Context) {
    const { wechatId } = ctx.wechatAccount;
    // 后台运行
    ctx.runInBackground(async () => {
      let batchCount = 0;
      const tempList: any[] = [];
      const openidList = await this.wechatUserService.getFollowers();
      // 遍历所有openid
      for (const list of openidList) {
        for (const index in list) {
          const key = Number(index);
          const openid = list[index];
          tempList.push(openid);
          // 一次查询100个用户的信息
          if ((key + 1) % 100 !== 0 && key + 1 !== list.length) {
            continue;
          }
          // 每次执行时间延迟2s
          setTimeout(
            ((openids: string[]) => () => {
              this.wechatUserService.batchUpdateWechatUser(wechatId, openids);
            })(tempList.slice()),
            (batchCount += 1) * 2000,
          );
          tempList.length = 0;
        }
      }
    });
    return '任务已执行';
  }

  @Get()
  @Summary('通过unionid，获取微信公众号用户信息')
  @ParametersWithToken({
    query: Joi.object().keys({
      unionid: Joi.string().required(),
    }),
  })
  async infoByUnionid(ctx: Context) {
    const { wechatId } = ctx.wechatAccount;
    const { unionid } = ctx.query;
    return await this.wechatUserService.findOne({
      wechatId,
      unionid,
    });
  }

  @Post()
  @Summary('批量获取用户是否关注公众号')
  @ParametersWithToken({
    body: Joi.object().keys({
      unionids: Joi.array()
        .items(Joi.string())
        .min(1)
        .max(100)
        .required()
        .description('unionid列表，最多100个'),
    }),
  })
  async batchCheckFollow(ctx: Context) {
    const { wechatId } = ctx.wechatAccount;
    const { unionids } = ctx.body;
    const records = await this.wechatUserService.find({
      fields: ['unionid', 'subscribe'],
      where: {
        wechatId,
        unionid_in: unionids,
      },
    });
    return unionids.map(unionid => {
      const record = records.find(record => record.unionid === unionid);
      return (
        record || {
          unionid,
          id: null,
          subscribe: 0,
        }
      );
    });
  }

  @Put()
  @Summary('手动更新微信公众号用户的unionid')
  @ParametersWithToken({
    body: Joi.object().keys({
      code: Joi.string()
        .required()
        .description('微信客户端code'),
      unionid: Joi.string()
        .required()
        .description('微信unionid'),
    }),
  })
  async updateUnionid(ctx: Context) {
    const { code, unionid } = ctx.body;
    const { openid } = await ctx.wechatApi.getOpenid(code);
    return await this.wechatUserService.update({ unionid }, { openid });
  }

  @Get()
  @Summary('获取微信公众号用户openid')
  @ParametersWithToken({
    query: Joi.object().keys({
      code: Joi.string()
        .required()
        .description('微信客户端code'),
    }),
  })
  async openid(ctx: Context) {
    const { code } = ctx.query;
    return await ctx.wechatApi.getOpenid(code);
  }
}
