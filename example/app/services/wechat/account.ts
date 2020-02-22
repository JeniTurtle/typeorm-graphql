import * as assert from 'assert';
import { Service } from 'typedi';
import { Repository, Transaction, TransactionRepository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { WxAccount } from '@typeorm/account/entity/wechat/account';
import { WxAccountConfig } from '@typeorm/account/entity/wechat/accountConfig';

@Service()
export default class WxAccountService extends BaseService<WxAccount> {
  @InjectRepository(WxAccountConfig)
  protected readonly accountConfigRepository: Repository<WxAccountConfig>;

  constructor(@InjectRepository(WxAccount) readonly repository: Repository<WxAccount>) {
    super(WxAccount, repository);
  }

  @Transaction('accountDB')
  async createAccount(
    data: WxAccount,
    @TransactionRepository(WxAccount) accountRepo?: Repository<WxAccount>,
    @TransactionRepository(WxAccountConfig) accountConfigRepo?: Repository<WxAccountConfig>,
  ) {
    const accountService = this.getService<WxAccount>(WxAccount, accountRepo);
    const accountConfigService = this.getService<WxAccountConfig>(WxAccountConfig, accountConfigRepo);
    const accountConfig = await accountConfigService.create({
      wechatId: data.wechatId,
    });
    return await accountService.create({
      ...data,
      config: accountConfig,
    });
  }

  @Transaction('accountDB')
  async deleteAccount(
    accountId: string,
    @TransactionRepository(WxAccount) accountRepo?: Repository<WxAccount>,
    @TransactionRepository(WxAccountConfig) accountConfigRepo?: Repository<WxAccountConfig>,
  ) {
    const accountService = this.getService<WxAccount>(WxAccount, accountRepo);
    const accountConfigService = this.getService<WxAccountConfig>(WxAccountConfig, accountConfigRepo);
    const account = await accountService.deleteOne({
      id: accountId,
    });
    const accountConfig =
      account && account.configId
        ? await accountConfigService.deleteOne({
            id: account.configId,
          })
        : null;
    return {
      account,
      accountConfig,
    };
  }

  @Transaction('accountDB')
  async updateAccount(
    data: {
      id: string;
      accountName?: string;
      appId?: string;
      appSecret?: string;
      wechatId?: string;
      organizationId?: string;
    },
    @TransactionRepository(WxAccount) accountRepo?: Repository<WxAccount>,
    @TransactionRepository(WxAccountConfig) accountConfigRepo?: Repository<WxAccountConfig>,
  ) {
    const accountService = this.getService<WxAccount>(WxAccount, accountRepo);
    const accountConfigService = this.getService<WxAccountConfig>(WxAccountConfig, accountConfigRepo);
    const account = await accountService.updateById(data, data.id);
    if (account?.configId) {
      await accountConfigService.updateById(
        {
          wechatId: data.wechatId,
        },
        account.configId,
      );
    }
    return account;
  }

  /**
   * 使用identityId或appId或wechatId获取账户信息
   * @param identityIdOrAppIdOrWechatId
   */
  async getAccountWithConfigInfo(identityIdOrAppIdOrWechatId: string) {
    const shortId = identityIdOrAppIdOrWechatId;
    return await this.findOne([{ appId: shortId }, { wechatId: shortId }, { identityId: shortId }], [], ['config']);
  }

  /**
   * 获取wechatApi实例
   * @param appIdOrWechatId
   */
  async getWechatApi(appIdOrWechatId: string) {
    assert(appIdOrWechatId, '请传入有效的appId或wechatId');
    const wechatAccount: WxAccount | null = await this.findOne([
      { appId: appIdOrWechatId },
      { wechatId: appIdOrWechatId },
    ]);
    if (!wechatAccount) {
      const { NOT_FOUND_WECHAT_ACCOUNT_ERROR } = this.ctx.app.exception.wechat;
      this.ctx.error(NOT_FOUND_WECHAT_ACCOUNT_ERROR);
    }
    const { appId, appSecret } = wechatAccount;
    return this.ctx.getWechatApi(appId, appSecret);
  }
}
