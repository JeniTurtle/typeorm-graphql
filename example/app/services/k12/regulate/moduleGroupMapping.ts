import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12ModuleGroupMapping } from '@typeorm/k12/entity/regulate/moduleGroupMapping';

@Service()
export default class K12ModuleGroupMappingService extends BaseService<K12ModuleGroupMapping> {
  constructor(@InjectRepository(K12ModuleGroupMapping) readonly repository: Repository<K12ModuleGroupMapping>) {
    super(K12ModuleGroupMapping, repository);
  }
}
