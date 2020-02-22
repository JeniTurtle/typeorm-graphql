import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { Department } from '@typeorm/account/entity/auth/department';

@Service()
export default class DepartmentService extends BaseService<Department> {
  constructor(@InjectRepository(Department) readonly repository: Repository<Department>) {
    super(Department, repository);
  }
}
