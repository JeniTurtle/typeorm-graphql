import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12SchoolModuleMapping } from '@typeorm/k12/entity/regulate/schoolModuleMapping';

@Service()
export default class K12SchoolModuleMappingService extends BaseService<K12SchoolModuleMapping> {
  constructor(@InjectRepository(K12SchoolModuleMapping) readonly repository: Repository<K12SchoolModuleMapping>) {
    super(K12SchoolModuleMapping, repository);
  }
}
