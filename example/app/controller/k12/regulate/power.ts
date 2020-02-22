import * as Joi from 'joi';
import { Context } from 'egg';
import { Post, Put, Delete, Get, Controller, Summary, Parameters } from 'egg-shell-plus';
import { Inject } from 'typedi';
import { K12Power, K12PowerStatus } from '@typeorm/k12/entity/regulate/power';
import { K12PowerCategoryType } from '@typeorm/k12/entity/regulate/powerCategory';
import { PermissionWithAction } from '@decorator/permission';
import PowerService from '@service/k12/regulate/power';
import PowerCategoryService from '@service/k12/regulate/powerCategory';

const mutatePowerCatParams = {
  name: Joi.string()
    .max(50)
    .required()
    .description('权限名'),
  code: Joi.string()
    .max(100)
    .required()
    .description('权限编号'),
  remark: Joi.string()
    .allow('')
    .max(500)
    .description('备注'),
  type: Joi.number()
    .integer()
    .valid(K12PowerCategoryType.NAV, K12PowerCategoryType.PERM)
    .description('权限类型，0权限，1导航'),
  applicationId: Joi.string()
    .required()
    .description('所属应用ID'),
};

const mutatePowerParams = {
  name: Joi.string()
    .max(50)
    .required()
    .description('权限名'),
  code: Joi.string()
    .max(100)
    .required()
    .description('权限编号'),
  order: Joi.number()
    .integer()
    .description('排序序号'),
  path: Joi.string()
    .allow('')
    .max(250)
    .description('导航地址'),
  icon: Joi.string()
    .allow('')
    .max(150)
    .description('导航图标'),
  remark: Joi.string()
    .allow('')
    .max(500)
    .description('备注'),
  superiorId: Joi.string().description('上级ID'),
  categoryId: Joi.string()
    .required()
    .description('分类ID'),
  status: Joi.number()
    .integer()
    .valid(K12PowerStatus.NORMAL, K12PowerStatus.DISABLE)
    .default(K12PowerStatus.NORMAL)
    .description('状态，0正常；1禁用'),
  moduleId: Joi.string().description('模块ID，不传表示通用'),
};

@Controller('云平台权限管理')
export default class PowerController {
  @Inject()
  readonly powerService: PowerService;

  @Inject()
  readonly powerCategoryService: PowerCategoryService;

  @Get()
  @Summary('用分类ID或分类编号获取权限或导航列表')
  @Parameters({
    query: Joi.object()
      .keys({
        withParent: Joi.number()
          .integer()
          .valid(0, 1)
          .default(0)
          .description('是否查询上级，0否1是'),
        categoryId: Joi.string().description('分类ID（选填），和分类编号2选1'),
        categoryCode: Joi.string().description('分类编号（选填），和分类ID2选1'),
      })
      .or('categoryId', 'categoryCode')
      .without('categoryId', 'categoryCode'),
  })
  @PermissionWithAction('read_k12_power')
  async list(ctx: Context) {
    let powers: K12Power[] = [];
    const { categoryId, categoryCode, withParent } = ctx.query;
    const relations: string[] = [];
    const where = { categoryId };
    const orderBy = 'order_ASC';
    if (categoryCode) {
      powers = await this.powerService.getPowersByCategoryCode(categoryCode, where, orderBy, relations);
    } else {
      powers = await this.powerService.find({
        where,
        relations,
        orderBy,
      });
    }
    return withParent ? await this.powerService.relaSupreior(powers) : powers;
  }

  @Post()
  @Summary('按照模块编号获取权限列表')
  @Parameters({
    body: Joi.object()
      .keys({
        withParent: Joi.number()
          .integer()
          .valid(0, 1)
          .default(0)
          .description('是否查询上级，0否1是'),
        withModule: Joi.number()
          .integer()
          .valid(0, 1)
          .default(0)
          .description('是否查询所属模块信息，0否1是'),
        moduleCodes: Joi.array()
          .items(Joi.string())
          .min(1)
          .description('模块编号列表（选填），跟模块ID列表2选1'),
        moduleIds: Joi.array()
          .items(Joi.string())
          .min(1)
          .description('模块ID列表（选填），跟模块code列表2选1'),
      })
      .or('moduleIds', 'moduleCodes')
      .without('moduleIds', 'moduleCodes'),
  })
  @PermissionWithAction('read_k12_power')
  async listByModules(ctx: Context) {
    let powers: K12Power[] = [];
    const { withModule, moduleIds, moduleCodes, withParent } = ctx.body;
    const where = { moduleId_in: moduleIds };
    const orderBy = 'order_ASC';
    const relations: string[] = [];
    withModule && relations.push('module');
    if (moduleCodes) {
      powers = await this.powerService.getPowersByModuleCodes(moduleCodes, where, orderBy, relations);
    } else {
      powers = await this.powerService.find({
        where,
        orderBy,
        relations,
      });
    }
    return withParent ? await this.powerService.relaSupreior(powers) : powers;
  }

  @Post()
  @Summary('新增权限')
  @Parameters({
    body: Joi.object().keys({
      ...mutatePowerParams,
    }),
  })
  @PermissionWithAction('write_k12_power')
  async create(ctx: Context) {
    await this.powerService.mutatePowerCheck(ctx.body);
    return await this.powerService.create(ctx.body);
  }

  @Put('/update/:id')
  @Summary('修改权限')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('权限ID，必填'),
    }),
    body: Joi.object().keys({
      ...mutatePowerParams,
    }),
  })
  @PermissionWithAction('write_k12_power')
  async update(ctx: Context) {
    const { id } = ctx.params;
    const data = {
      ...ctx.body,
      id,
    };
    await this.powerService.mutatePowerCheck(data);
    return await this.powerService.updateById(data, id);
  }

  @Delete('/delete/:id')
  @Summary('删除权限')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('权限ID，必填'),
    }),
  })
  @PermissionWithAction('write_k12_power')
  async delete(ctx: Context) {
    const { id } = ctx.params;
    await this.powerService.inspectDelete(id);
    return await this.powerService.deleteById(id);
  }

  @Get('/category/list')
  @Summary('获取权限分类列表')
  @Parameters({
    query: Joi.object().keys({
      applicationId: Joi.string().description('应用ID'),
      type: Joi.number()
        .integer()
        .valid(K12PowerCategoryType.NAV, K12PowerCategoryType.PERM)
        .required()
        .description('权限类型；0权限，1导航'),
    }),
  })
  @PermissionWithAction('read_k12_power')
  async categoryList(ctx: Context) {
    const { type, applicationId } = ctx.query;
    return await this.powerCategoryService.find({
      where: { type, applicationId },
    });
  }

  @Post('/category/create')
  @Summary('新增权限分类')
  @Parameters({
    body: Joi.object().keys({
      ...mutatePowerCatParams,
    }),
  })
  @PermissionWithAction('write_k12_power')
  async createCategory(ctx: Context) {
    await this.powerCategoryService.mutatePowerCatgoryCheck(ctx.body);
    return await this.powerCategoryService.create(ctx.body);
  }

  @Put('/category/update/:id')
  @Summary('修改权限分类')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('权限分类ID，必填'),
    }),
    body: Joi.object().keys({
      ...mutatePowerCatParams,
    }),
  })
  @PermissionWithAction('write_k12_power')
  async updateCategory(ctx: Context) {
    const { id } = ctx.params;
    const data = {
      ...ctx.body,
      id,
    };
    await this.powerCategoryService.mutatePowerCatgoryCheck(data);
    return await this.powerCategoryService.updateById(data, id);
  }

  @Delete('/category/delete/:id')
  @Summary('删除权限分类')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('权限分类ID，必填'),
    }),
  })
  @PermissionWithAction('write_k12_power')
  async deleteCateogry(ctx: Context) {
    const { id } = ctx.params;
    await this.powerCategoryService.inspectDelete(id);
    return await this.powerCategoryService.deleteById(id);
  }
}
