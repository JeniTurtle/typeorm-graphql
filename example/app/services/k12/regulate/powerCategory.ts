import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12PowerCategory, K12PowerCategoryType } from '@typeorm/k12/entity/regulate/powerCategory';
import PowerService from './power';

export interface IMutatePowerCategoryParams {
  id?: string;
  name: string;
  code: string;
  remark?: string;
  type?: K12PowerCategoryType;
  applicationId: string;
}

@Service()
export default class K12PowerCategoryService extends BaseService<K12PowerCategory> {
  @Inject(_type => PowerService)
  powerService: PowerService;

  constructor(@InjectRepository(K12PowerCategory) readonly repository: Repository<K12PowerCategory>) {
    super(K12PowerCategory, repository);
  }

  /**
   * 检查是否可以删除
   * @param id
   */
  async inspectDelete(id: string): Promise<boolean> {
    const { POWER_CATEGORY_NOT_ALLOW_DELETE_ERROR } = this.app.exception.k12.regulate;
    const count = await this.powerService.count({
      categoryId: id,
    });
    if (count) {
      this.ctx.error(POWER_CATEGORY_NOT_ALLOW_DELETE_ERROR);
    }
    return true;
  }

  async mutatePowerCatgoryCheck({ id, code, applicationId }: IMutatePowerCategoryParams) {
    const { CODE_ALREADY_EXIST_ERROR } = this.app.exception.k12.regulate;
    const category = await this.findOne({ code, applicationId }, ['id']);
    if ((!id && category) || (id && category && id !== category.id)) {
      this.ctx.error(CODE_ALREADY_EXIST_ERROR);
    }
    return true;
  }
}
