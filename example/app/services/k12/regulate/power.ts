import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12Power } from '@typeorm/k12/entity/regulate/power';
import { K12PowerCategory } from '@typeorm/k12/entity/regulate/powerCategory';
import { K12ModuleIsCategory } from '@typeorm/k12/entity/regulate/module';
import ModuleService from './module';
import PowerCategoryService from './powerCategory';
import PowerModuleMappingService from './powerModuleMapping';

export interface IMutatePowerParams {
  id?: string;
  code: string;
  moduleId?: string;
  superiorId?: string;
  categoryId: string;
  [props: string]: any;
}

@Service()
export default class K12PowerService extends BaseService<K12Power> {
  @Inject(_type => ModuleService)
  readonly moduleService: ModuleService;

  @Inject(_type => PowerCategoryService)
  readonly categoryService: PowerCategoryService;

  @Inject()
  readonly powerModuleMappingService: PowerModuleMappingService;

  constructor(@InjectRepository(K12Power) readonly repository: Repository<K12Power>) {
    super(K12Power, repository);
  }

  /**
   * 获取上级权限信息
   */
  async relaSupreior(powers: K12Power[]) {
    // 获取上级权限列表
    const parents = await this.find({
      where: {
        id_in: powers.map(power => power.superiorId),
      },
    });
    // 关联上级权限
    powers.forEach(power => {
      for (const parent of parents) {
        if (parent.id === power.superiorId) {
          power.superior = parent;
          break;
        }
      }
    });
    return powers;
  }

  async checkIsCategory(categoryId: string): Promise<K12PowerCategory> | never {
    const { TARGET_NOT_FOUNT_ERROR } = this.app.exception.k12.regulate;
    const target = await this.categoryService.findById(categoryId, ['id']);
    if (!target) {
      this.ctx.error(TARGET_NOT_FOUNT_ERROR);
    }
    return target;
  }

  async checkIsPower(targetOrId: K12Power | string | null): Promise<K12Power> | never {
    const { TARGET_NOT_FOUNT_ERROR } = this.app.exception.k12.regulate;
    const target = typeof targetOrId === 'string' ? await this.findById(targetOrId, ['id']) : targetOrId;
    if (!target) {
      this.ctx.error(TARGET_NOT_FOUNT_ERROR);
    }
    return target;
  }

  /**
   * 检查权限创建和更新时，传入的数据
   */
  async mutatePowerCheck({ id, code, moduleId, categoryId, superiorId }: IMutatePowerParams): Promise<boolean> | never {
    const { CODE_ALREADY_EXIST_ERROR } = this.app.exception.k12.regulate;
    const operationList: any[] = [this.findOne({ code, categoryId }, ['id'])];
    if (moduleId) {
      operationList.push(this.moduleService.checkIsModule(moduleId));
    }
    if (categoryId) {
      operationList.push(this.checkIsCategory(categoryId));
    }
    if (superiorId) {
      operationList.push(this.checkIsPower(superiorId));
    }
    const [power] = await Promise.all(operationList);
    if ((!id && power) || (id && power && id !== power.id)) {
      this.ctx.error(CODE_ALREADY_EXIST_ERROR);
    }
    return true;
  }

  /**
   * 根据分类code获取分类下所有权限
   */
  async getPowersByCategoryCode(code: string, where: any, orderBy: string, relations: string[] = []) {
    const category = await this.categoryService.findOne({ code }, ['id']);
    return category
      ? await this.find({
          orderBy,
          relations,
          where: {
            ...where,
            categoryId: category.id,
          },
        })
      : [];
  }

  /**
   * 根据模块code列表获取所有权限
   */
  async getPowersByModuleCodes(codes: string[], where: any, orderBy: string, relations: string[] = []) {
    const modules = await this.moduleService.find({
      where: {
        code_in: codes,
        isCategory: K12ModuleIsCategory.NO,
      },
      fields: ['id'],
    });
    return modules.length > 0
      ? await this.find({
          orderBy,
          relations,
          where: {
            ...where,
            moduleId_in: modules.map(module => module.id),
          },
        })
      : [];
  }

  /**
   * 检查该权限或分类是否可以删除
   */
  async inspectDelete(id: string): Promise<K12Power | null> {
    const { TARGET_NOT_FOUNT_ERROR, POWER_NOT_ALLOW_DELETE_ERROR } = this.app.exception.k12.regulate;
    const target = await this.findById(id);
    if (!target) {
      this.ctx.error(TARGET_NOT_FOUNT_ERROR);
    }
    const subCount = await this.count({
      superiorId: id,
    });
    if (subCount) {
      this.ctx.error(POWER_NOT_ALLOW_DELETE_ERROR);
    }
    return target;
  }

  /**
   * 获取模块已绑定的权限ID列表
   * @param moduleId
   */
  async getPowersIdsByModule({ moduleId, powerCategoryId }: { moduleId: string; powerCategoryId: string }) {
    const records = await this.repository
      .createQueryBuilder('power')
      .where('power.categoryId = :powerCategoryId')
      .andWhere('power.deletedAt is null')
      .innerJoin('power.powerModuleMappings', 'mappings', 'mappings.moduleId = :moduleId')
      .andWhere('mappings.deletedAt is null')
      .setParameters({ moduleId, powerCategoryId })
      .getMany();
    return Array.from(new Set(records.map(record => record.id)));
  }
}
