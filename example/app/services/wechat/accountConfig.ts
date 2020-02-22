import { Service } from 'typedi';
import { Repository, Transaction, TransactionRepository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { WxAccount } from '@typeorm/account/entity/wechat/account';
import { WxAccountConfig } from '@typeorm/account/entity/wechat/accountConfig';

@Service()
export default class WxAccountConfigService extends BaseService<WxAccountConfig> {
  @InjectRepository(WxAccount)
  protected readonly accountRepository: Repository<WxAccount>;

  constructor(@InjectRepository(WxAccountConfig) readonly repository: Repository<WxAccountConfig>) {
    super(WxAccountConfig, repository);
  }

  @Transaction('accountDB')
  async updateAccount(
    data: {
      id: string;
      wechatId?: string;
      subMchId?: string;
      messageCallbackUrl?: string;
      followReply?: string;
    },
    @TransactionRepository(WxAccount) accountRepo?: Repository<WxAccount>,
    @TransactionRepository(WxAccountConfig) accountConfigRepo?: Repository<WxAccountConfig>,
  ) {
    const accountService = this.getService<WxAccount>(WxAccount, accountRepo);
    const accountConfigService = this.getService<WxAccountConfig>(WxAccountConfig, accountConfigRepo);
    const accountConfig = await accountConfigService.update(data, {
      id: data.id,
    });
    accountConfig &&
      (await accountService.update(
        {
          wechatId: data.wechatId,
        },
        {
          config: accountConfig,
        },
      ));
    return accountConfig;
  }
}
