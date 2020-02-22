import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12PowerModuleMapping } from '@typeorm/k12/entity/regulate/powerModuleMapping';

@Service()
export default class K12PowerModuleMappingService extends BaseService<K12PowerModuleMapping> {
  constructor(@InjectRepository(K12PowerModuleMapping) readonly repository: Repository<K12PowerModuleMapping>) {
    super(K12PowerModuleMapping, repository);
  }
}
