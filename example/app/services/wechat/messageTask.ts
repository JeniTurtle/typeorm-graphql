import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { WxMessageTask } from '@typeorm/account/entity/wechat/messageTask';

@Service()
export default class WxMessageTaskService extends BaseService<WxMessageTask> {
  constructor(@InjectRepository(WxMessageTask) readonly repository: Repository<WxMessageTask>) {
    super(WxMessageTask, repository);
  }
}
