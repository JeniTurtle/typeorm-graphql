import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { Organization } from '@typeorm/account/entity/auth/organization';

@Service()
export default class OrganizationService extends BaseService<Organization> {
  constructor(@InjectRepository(Organization) readonly repository: Repository<Organization>) {
    super(Organization, repository);
  }
}
