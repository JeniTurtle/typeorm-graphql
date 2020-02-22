import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12Application } from '@typeorm/k12/entity/regulate/application';
import ModuleService from './module';

@Service()
export default class K12ApplicationService extends BaseService<K12Application> {
  @Inject()
  readonly moduleService: ModuleService;

  constructor(@InjectRepository(K12Application) readonly repository: Repository<K12Application>) {
    super(K12Application, repository);
  }

  /**
   * 检查code是否重复
   * @param id
   */
  async inspectCode(code: string, id?: string): Promise<boolean> {
    const { CODE_ALREADY_EXIST_ERROR } = this.app.exception.k12.regulate;
    const app = await this.findOne(
      {
        code,
      },
      ['id'],
    );
    if ((!id && app) || (id && app && app.id !== id)) {
      this.ctx.error(CODE_ALREADY_EXIST_ERROR);
    }
    return true;
  }

  /**
   * 检查是否可以删除
   * @param id
   */
  async inspectDelete(id: string): Promise<boolean> {
    const { APP_NOT_ALLOW_DELETE_ERROR } = this.app.exception.k12.regulate;
    const count = await this.moduleService.count({
      applicationId: id,
    });
    if (count) {
      this.ctx.error(APP_NOT_ALLOW_DELETE_ERROR);
    }
    return true;
  }

  async deleteApp(id: string) {
    await this.inspectDelete(id);
    return this.deleteById(id);
  }
}
