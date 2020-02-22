import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { Platform } from '@typeorm/account/entity/auth/platform';

@Service()
export default class PlatformService extends BaseService<Platform> {
  constructor(@InjectRepository(Platform) readonly repository: Repository<Platform>) {
    super(Platform, repository);
  }
}
