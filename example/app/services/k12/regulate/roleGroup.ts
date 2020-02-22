import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12RoleGroup } from '@typeorm/k12/entity/regulate/roleGroup';

@Service()
export default class K12RoleGroupService extends BaseService<K12RoleGroup> {
  constructor(@InjectRepository(K12RoleGroup) readonly repository: Repository<K12RoleGroup>) {
    super(K12RoleGroup, repository);
  }
}
