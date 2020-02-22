import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12SchoolExtend } from '@typeorm/k12/entity/regulate/schoolExtend';

@Service()
export default class K12SchoolExtendService extends BaseService<K12SchoolExtend> {
  constructor(@InjectRepository(K12SchoolExtend) readonly repository: Repository<K12SchoolExtend>) {
    super(K12SchoolExtend, repository);
  }
}
