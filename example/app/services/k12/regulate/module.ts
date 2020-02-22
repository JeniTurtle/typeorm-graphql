import { Service, Inject } from 'typedi';
import { Repository, Transaction, TransactionRepository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { K12Module, K12ModuleIsCategory } from '@typeorm/k12/entity/regulate/module';
import { K12ModuleGroupMapping } from '@typeorm/k12/entity/regulate/moduleGroupMapping';
import { K12SchoolModuleMapping } from '@typeorm/k12/entity/regulate/schoolModuleMapping';
import { K12PowerModuleMapping } from '@typeorm/k12/entity/regulate/powerModuleMapping';
import K12PowerService from './power';
import K12RoleGroupService from './roleGroup';
import K12SchoolModuleMappingService from './schoolModuleMapping';
import K12PowerModuleMappingService from './powerModuleMapping';

export interface IMutateModuleParams {
  id?: string;
  code: string;
  categoryId?: string;
  applicationId?: string;
  superiorId?: string;
  [props: string]: any;
  isCategory: K12ModuleIsCategory;
}

@Service()
export default class K12ModuleService extends BaseService<K12Module> {
  @Inject(_type => K12PowerService)
  readonly powerService: K12PowerService;

  @Inject()
  readonly roleGroupService: K12RoleGroupService;

  @Inject()
  readonly powerModuleMappingService: K12PowerModuleMappingService;

  @Inject()
  readonly schoolModuleMappingService: K12SchoolModuleMappingService;

  constructor(@InjectRepository(K12Module) readonly repository: Repository<K12Module>) {
    super(K12Module, repository);
  }

  async getSchoolIdsByModule(moduleId: string): Promise<number[]> {
    const records = await this.schoolModuleMappingService.find({
      where: {
        moduleId,
      },
    });
    return Array.from(new Set(records.map(record => record.schoolId)));
  }

  async getModulesBySchool({ schoolId, categoryId }: { schoolId: number; categoryId: string }) {
    const [allModules, bindModules] = await Promise.all([
      this.find({
        where: {
          categoryId,
          isCategory: K12ModuleIsCategory.NO,
        },
      }),
      this.schoolModuleMappingService.find({
        where: {
          schoolId,
        },
      }),
    ]);
    return allModules.filter(module => bindModules.find(item => item.moduleId === module.id));
  }

  @Transaction('k12DB')
  async deleteModule(
    id: string,
    @TransactionRepository(K12Module) moduleRepo?: Repository<K12Module>,
    @TransactionRepository(K12ModuleGroupMapping) mappingRepo?: Repository<K12ModuleGroupMapping>,
  ) {
    const moduleService = this.getService<K12Module>(K12Module, moduleRepo);
    const mappingService = this.getService<K12ModuleGroupMapping>(K12ModuleGroupMapping, mappingRepo);
    await this.inspectDelete(id);
    await mappingService.delete({
      moduleId: id,
    });
    return await moduleService.deleteById(id);
  }

  /**
   * 检查该模块或分类是否可以删除
   */
  async inspectDelete(id: string): Promise<K12Module | null> {
    const {
      TARGET_NOT_FOUNT_ERROR,
      MODULE_NOT_ALLOW_DELETE_ERROR,
      CATEGORY_NOT_ALLOW_DELETE_ERROR,
    } = this.app.exception.k12.regulate;
    const target = await this.findById(id);
    if (!target) {
      this.ctx.error(TARGET_NOT_FOUNT_ERROR);
    }
    if (target.isCategory === K12ModuleIsCategory.YES) {
      const [moduleCount, roleGroupCount] = await Promise.all([
        this.count({
          categoryId: id,
        }),
        this.roleGroupService.count({
          moduleCategoryId: id,
        }),
      ]);
      (moduleCount || roleGroupCount) && this.ctx.error(CATEGORY_NOT_ALLOW_DELETE_ERROR);
    } else {
      const [subCount, powerCount, schoolCount] = await Promise.all([
        this.count({
          superiorId: id,
        }),
        this.powerModuleMappingService.count({
          moduleId: id,
        }),
        this.schoolModuleMappingService.count({
          moduleId: id,
        }),
      ]);
      (subCount || powerCount || schoolCount) && this.ctx.error(MODULE_NOT_ALLOW_DELETE_ERROR);
    }
    return target;
  }

  /**
   * 根据分类code获取分类下所有模块
   */
  async getModulesByCategoryCode(code: string, fields: string[] = []) {
    const category = await this.findOne(
      {
        code,
        isCategory: K12ModuleIsCategory.YES,
      },
      ['id'],
    );
    return category
      ? await this.find({
          fields,
          where: {
            categoryId: category.id,
            isCategory: K12ModuleIsCategory.NO,
          },
        })
      : [];
  }

  async checkIsCategory(targetOrId: K12Module | string | null): Promise<K12Module> | never {
    const { TARGET_NOT_FOUNT_ERROR, TARGET_IS_NOT_CATEGORY_ERROR } = this.app.exception.k12.regulate;
    const target = typeof targetOrId === 'string' ? await this.findById(targetOrId, ['isCategory']) : targetOrId;
    if (!target) {
      this.ctx.error(TARGET_NOT_FOUNT_ERROR);
    }
    if (target.isCategory !== K12ModuleIsCategory.YES) {
      this.ctx.error(TARGET_IS_NOT_CATEGORY_ERROR);
    }
    return target;
  }

  async checkIsModule(targetOrId: K12Module | string | null): Promise<K12Module> | never {
    const { TARGET_NOT_FOUNT_ERROR, TARGET_IS_NOT_MODULE_ERROR } = this.app.exception.k12.regulate;
    const target = typeof targetOrId === 'string' ? await this.findById(targetOrId, ['isCategory']) : targetOrId;
    if (!target) {
      this.ctx.error(TARGET_NOT_FOUNT_ERROR);
    }
    if (target.isCategory === K12ModuleIsCategory.YES) {
      this.ctx.error(TARGET_IS_NOT_MODULE_ERROR);
    }
    return target;
  }

  /**
   * 检查模块创建和更新时，传入的categoryId和superiorId是否有效
   */
  async mutateModuleCheck({ id, code, categoryId, superiorId, applicationId, isCategory }: IMutateModuleParams) {
    const { CODE_ALREADY_EXIST_ERROR } = this.app.exception.k12.regulate;
    const baseCondition: any = { code };
    if (isCategory === K12ModuleIsCategory.YES) {
      Object.assign(baseCondition, { applicationId });
    } else {
      Object.assign(baseCondition, { categoryId });
    }
    const operationList: any[] = [this.findOne(baseCondition, ['id'])];
    if (categoryId) {
      operationList.push(this.checkIsCategory(categoryId));
    }
    if (superiorId) {
      operationList.push(this.checkIsModule(superiorId));
    }
    const [module] = await Promise.all(operationList);
    if ((!id && module) || (id && module && module.id !== id)) {
      this.ctx.error(CODE_ALREADY_EXIST_ERROR);
    }
    return true;
  }

  /**
   * 过滤模块ID
   * @param moduleIds
   */
  async filterModules(moduleIds: string[]) {
    const ret = await this.find({
      fields: ['id'],
      where: {
        isCategory: K12ModuleIsCategory.NO,
        id_in: moduleIds,
      },
    });
    return ret.map(record => record.id);
  }

  /**
   * 给学校绑定模块
   * @param param0
   * @param mappingRepo
   */
  async bindSchoolModules(
    { schoolId, moduleIds }: { schoolId: number; moduleIds: string[] },
    mappingRepo?: Repository<K12SchoolModuleMapping>,
  ) {
    const mappingService = this.getService<K12SchoolModuleMapping>(
      K12SchoolModuleMapping,
      mappingRepo || this.schoolModuleMappingService.repository,
    );
    // 从新增的模块中，获取学校已经绑定的模块列表
    const existingData: K12SchoolModuleMapping[] = await mappingService.find({
      fields: ['moduleId'],
      where: {
        schoolId,
        moduleId_in: moduleIds,
      },
    });
    // 如果该学校已经有模块了，那么不再新增
    const data = moduleIds
      .filter(moduleId => !existingData.find(entity => entity.moduleId === moduleId))
      .map(id => ({
        schoolId,
        moduleId: id,
      }));
    // 新增学校没有的模块
    const results = await mappingService.createMany(data);
    return existingData.concat(results);
  }

  /**
   * 给学校解绑模块
   * @param param0
   * @param mappingRepo
   */
  async unbindSchoolModules(
    { schoolId, moduleIds = [] }: { schoolId: number; moduleIds?: string[] },
    mappingRepo?: Repository<K12SchoolModuleMapping>,
  ) {
    const mappingService = this.getService<K12SchoolModuleMapping>(
      K12SchoolModuleMapping,
      mappingRepo || this.schoolModuleMappingService.repository,
    );
    // 不传模块id，默认删除所有
    const where: any = {
      schoolId,
    };
    // 传模块id，只删除传入的
    if (moduleIds.length > 0) {
      where.moduleId_in = moduleIds;
    }
    return await mappingService.delete(where);
  }

  /**
   * 给模块绑定学校
   * @param param0
   * @param mappingRepo
   */
  async bindModuleSchools(
    { schoolIds, moduleId }: { schoolIds: number[]; moduleId: string },
    mappingRepo?: Repository<K12SchoolModuleMapping>,
  ) {
    const mappingService = this.getService<K12SchoolModuleMapping>(
      K12SchoolModuleMapping,
      mappingRepo || this.schoolModuleMappingService.repository,
    );
    // 从新增的学校中，获取模块已经绑定的学校列表
    const existingData: K12SchoolModuleMapping[] = await mappingService.find({
      fields: ['schoolId'],
      where: {
        moduleId,
        schoolId_in: schoolIds,
      },
    });
    // 如果该学校已经绑定了，那么不再新增
    const data = schoolIds
      .filter(schoolId => !existingData.find(entity => entity.schoolId === schoolId))
      .map(id => ({
        moduleId,
        schoolId: id,
      }));
    // 新增学校没有的模块
    const results = await mappingService.createMany(data);
    return existingData.concat(results);
  }

  /**
   * 给模块解绑学校
   * @param param0
   * @param mappingRepo
   */
  async unbindModuleSchools(
    { schoolIds = [], moduleId }: { schoolIds?: number[]; moduleId: string },
    mappingRepo?: Repository<K12SchoolModuleMapping>,
  ) {
    const mappingService = this.getService<K12SchoolModuleMapping>(
      K12SchoolModuleMapping,
      mappingRepo || this.schoolModuleMappingService.repository,
    );
    // 不传学校id，默认删除所有
    const where: any = {
      moduleId,
    };
    // 传学校id，只删除传入的
    if (schoolIds.length > 0) {
      where.schoolId_in = schoolIds;
    }
    return await mappingService.delete(where);
  }

  /**
   * 先删除学校所有模块，再添加新模块
   * @param param0
   * @param mappingRepo
   */
  @Transaction('k12DB')
  async transferSchoolModules(
    { schoolId, moduleIds = [] }: { schoolId: number; moduleIds?: string[] },
    @TransactionRepository(K12SchoolModuleMapping) mappingRepo?: Repository<K12SchoolModuleMapping>,
  ) {
    // 删除学校所有模块
    await this.unbindSchoolModules({ schoolId }, mappingRepo);
    // 绑定新模块
    return await this.bindSchoolModules({ schoolId, moduleIds }, mappingRepo);
  }

  /**
   * 先删除所有绑定模块的学校，再重新绑定新学校
   * @param param0
   * @param mappingRepo
   */
  @Transaction('k12DB')
  async transferModuleSchools(
    { schoolIds = [], moduleId }: { schoolIds: number[]; moduleId: string },
    @TransactionRepository(K12SchoolModuleMapping) mappingRepo?: Repository<K12SchoolModuleMapping>,
  ) {
    // 删除模块下所有学校
    await this.unbindModuleSchools({ moduleId }, mappingRepo);
    // 绑定新学校
    return await this.bindModuleSchools({ moduleId, schoolIds }, mappingRepo);
  }

  /**
   * 给模块绑定权限
   * @param param0
   * @param mappingRepo
   */
  async bindPowers(
    { powerIds, moduleId }: { powerIds: string[]; moduleId: string },
    mappingRepo?: Repository<K12PowerModuleMapping>,
  ) {
    const mappingService = this.getService<K12PowerModuleMapping>(
      K12PowerModuleMapping,
      mappingRepo || this.powerModuleMappingService.repository,
    );
    // 从新增的学校中，获取模块已经绑定的学校列表
    const existingData: K12PowerModuleMapping[] = await mappingService.find({
      fields: ['powerId'],
      where: {
        moduleId,
        powerId_in: powerIds,
      },
    });
    // 如果该权限已经绑定了，那么不再新增
    const data = powerIds
      .filter(powerId => !existingData.find(entity => entity.powerId === powerId))
      .map(id => ({
        moduleId,
        powerId: id,
      }));
    // 新增没有的权限
    const results = await mappingService.createMany(data);
    return existingData.concat(results);
  }

  /**
   * 给模块解绑权限
   * @param param0
   * @param mappingRepo
   */
  async unbindPowers(
    { powerIds = [], moduleId }: { powerIds?: string[]; moduleId: string },
    mappingRepo?: Repository<K12PowerModuleMapping>,
  ) {
    const mappingService = this.getService<K12PowerModuleMapping>(
      K12PowerModuleMapping,
      mappingRepo || this.powerModuleMappingService.repository,
    );
    // 不传权限id，默认删除所有
    const where: any = {
      moduleId,
    };
    // 传权限id，只删除传入的
    if (powerIds.length > 0) {
      where.powerId_in = powerIds;
    }
    return await mappingService.delete(where);
  }

  /**
   * 先删除所有绑定模块的权限，再重新绑定新权限
   * @param param0
   * @param mappingRepo
   */
  @Transaction('k12DB')
  async transferPowers(
    { powerIds = [], moduleId }: { powerIds: string[]; moduleId: string },
    @TransactionRepository(K12PowerModuleMapping) mappingRepo?: Repository<K12PowerModuleMapping>,
  ) {
    // 删除模块下所有权限
    await this.unbindPowers({ moduleId }, mappingRepo);
    // 绑定新权限
    return await this.bindPowers({ moduleId, powerIds }, mappingRepo);
  }
}
