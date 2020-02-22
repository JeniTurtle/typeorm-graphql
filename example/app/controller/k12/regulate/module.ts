/**
 * 如果你想要试图维护这套权限功能，希望你不会被表名所迷惑，以及中间业务关系极其复杂，很容易让你迷失自我。
 * 但是你要相信这套系统是标准的、规范的、稳定的、灵活的、而且兼容现有项目的，不要试图重写，改改bug就好，这就是最好的解决方案。
 * 假如你实在无法理解其中的关系，总觉得会存在你现在无法想象到的问题，那么就不要想了，去把时间用在你真正需要做的事情上。
 */
import * as Joi from 'joi';
import { Context } from 'egg';
import { Post, Put, Delete, Get, Controller, Summary, Parameters } from 'egg-shell-plus';
import { Inject } from 'typedi';
import { PermissionWithAction } from '@decorator/permission';
import { K12ModuleIsCategory, K12ModuleStatus } from '@typeorm/k12/entity/regulate/module';
import PowerService from '@service/k12/regulate/power';
import ModuleService from '@service/k12/regulate/module';

const mutateModuleParams = {
  name: Joi.string()
    .max(50)
    .required()
    .description('分类或模块名'),
  code: Joi.string()
    .max(100)
    .required()
    .description('分类或模块编号'),
  remark: Joi.string()
    .allow('')
    .max(500)
    .description('备注'),
  order: Joi.number()
    .integer()
    .min(0)
    .description('排序号'),
  isCategory: Joi.number()
    .integer()
    .required()
    .valid(K12ModuleIsCategory.YES, K12ModuleIsCategory.NO)
    .description('是否是分类'),
  categoryId: Joi.when('isCategory', {
    is: K12ModuleIsCategory.YES,
    then: Joi.valid(null).default(null),
    otherwise: Joi.string().required(),
  }).description('所属分类ID，isCategory为1时不填，为0必填'),
  applicationId: Joi.when('isCategory', {
    is: K12ModuleIsCategory.NO,
    then: Joi.valid(null).default(null),
    otherwise: Joi.string().required(),
  }).description('所属应用ID，isCategory为0时不填，为1必填'),
  superiorId: Joi.string().description('上级ID'),
  status: Joi.number()
    .integer()
    .valid(K12ModuleStatus.NORMAL, K12ModuleStatus.DISABLE)
    .default(K12ModuleStatus.NORMAL)
    .description('状态，0正常；1禁用'),
};

@Controller('云平台功能模块管理')
export default class ModuleController {
  @Inject()
  readonly moduleService: ModuleService;

  @Inject()
  readonly powerService: PowerService;

  @Get()
  @Summary('按照分类获取功能模块列表')
  @Parameters({
    query: Joi.object()
      .keys({
        categoryId: Joi.string().description('分类ID（选填），和分类编号2选1'),
        categoryCode: Joi.string().description('分类编号（选填），和分类ID2选1'),
      })
      .or('categoryId', 'categoryCode')
      .without('categoryId', 'categoryCode'),
  })
  @PermissionWithAction('read_k12_module')
  async list(ctx: Context) {
    const { categoryId, categoryCode } = ctx.query;
    if (categoryCode) {
      return await this.moduleService.getModulesByCategoryCode(categoryCode);
    }
    return await this.moduleService.find({
      where: { categoryId },
    });
  }

  @Get()
  @Summary('获取学校下的模块列表')
  @Parameters({
    query: Joi.object().keys({
      schoolId: Joi.string()
        .required()
        .description('学校ID'),
      categoryId: Joi.string()
        .required()
        .description('分类ID'),
    }),
  })
  @PermissionWithAction('read_k12_module')
  async listBySchool(ctx: Context) {
    const { schoolId, categoryId } = ctx.query;
    return await this.moduleService.getModulesBySchool({
      schoolId,
      categoryId,
    });
  }

  @Get('/category/list')
  @Summary('获取模块分类列表')
  @Parameters({
    query: Joi.object().keys({
      applicationId: Joi.string().description('应用ID，不传查询所有'),
    }),
  })
  @PermissionWithAction('read_k12_module')
  async categoryList(ctx: Context) {
    const { applicationId } = ctx.query;
    return await this.moduleService.find({
      where: {
        applicationId,
        isCategory: K12ModuleIsCategory.YES,
      },
    });
  }

  @Get('/detail/:id')
  @Summary('使用ID获取模块或分类信息')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('模块ID'),
    }),
  })
  @PermissionWithAction('read_k12_module')
  async detail(ctx: Context) {
    const { id } = ctx.params;
    return await this.moduleService.findById(id);
  }

  @Post()
  @Summary('新增模块或分类')
  @Parameters({
    body: Joi.object().keys({
      ...mutateModuleParams,
    }),
  })
  @PermissionWithAction('write_k12_module')
  async create(ctx: Context) {
    await this.moduleService.mutateModuleCheck(ctx.body);
    return await this.moduleService.create(ctx.body);
  }

  @Put('/update/:id')
  @Summary('修改模块或分类')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('模块或分类ID，必填'),
    }),
    body: Joi.object().keys({
      ...mutateModuleParams,
    }),
  })
  @PermissionWithAction('write_k12_module')
  async update(ctx: Context) {
    const { id } = ctx.params;
    const { superiorId } = ctx.body;
    const data = {
      ...ctx.body,
      id,
      superiorId: superiorId === id ? null : superiorId,
    };
    await this.moduleService.mutateModuleCheck(data);
    return await this.moduleService.updateById(data, id);
  }

  @Delete('/delete/:id')
  @Summary('删除模块或分类')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('模块分类ID，必填'),
    }),
  })
  @PermissionWithAction('write_k12_module')
  async delete(ctx: Context) {
    const { id } = ctx.params;
    return await this.moduleService.deleteModule(id);
  }

  @Post('/school/bind/modules/:schoolId')
  @Summary('给学校绑定功能模块')
  @Parameters({
    pathParams: Joi.object().keys({
      schoolId: Joi.number()
        .integer()
        .required()
        .description('学校ID'),
    }),
    body: Joi.object().keys({
      moduleIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .description('要绑定的模块ID列表'),
    }),
  })
  @PermissionWithAction('write_k12_module')
  async schoolBindModules(ctx: Context) {
    const { schoolId } = ctx.params;
    const { moduleIds } = ctx.body;
    return await this.moduleService.bindSchoolModules({
      schoolId,
      moduleIds,
    });
  }

  @Delete('/school/unbind/modules/:schoolId')
  @Summary('给学校解绑模块')
  @Parameters({
    pathParams: Joi.object().keys({
      schoolId: Joi.number()
        .integer()
        .required()
        .description('学校ID'),
    }),
    body: Joi.object().keys({
      moduleIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .description('要解绑的模块ID列表'),
    }),
  })
  @PermissionWithAction('write_k12_module')
  async schoolUnbindModules(ctx: Context) {
    const { schoolId } = ctx.params;
    const { moduleIds } = ctx.body;
    return await this.moduleService.unbindSchoolModules({
      schoolId,
      moduleIds,
    });
  }

  @Post('/bind/schools/:moduleId')
  @Summary('给功能模块绑定学校')
  @Parameters({
    pathParams: Joi.object().keys({
      moduleId: Joi.string()
        .required()
        .description('模块ID'),
    }),
    body: Joi.object().keys({
      schoolIds: Joi.array()
        .items(Joi.number().integer())
        .min(1)
        .description('要绑定的学校ID列表'),
    }),
  })
  @PermissionWithAction('write_k12_module')
  async bindSchools(ctx: Context) {
    const { moduleId } = ctx.params;
    const { schoolIds } = ctx.body;
    return await this.moduleService.bindModuleSchools({
      moduleId,
      schoolIds,
    });
  }

  @Delete('/unbind/schools/:moduleId')
  @Summary('给功能模块解绑学校')
  @Parameters({
    pathParams: Joi.object().keys({
      moduleId: Joi.string()
        .required()
        .description('模块ID'),
    }),
    body: Joi.object().keys({
      schoolIds: Joi.array()
        .items(Joi.number().integer())
        .min(1)
        .description('要解绑的学校ID列表'),
    }),
  })
  @PermissionWithAction('write_k12_module')
  async unbindSchools(ctx: Context) {
    const { moduleId } = ctx.params;
    const { schoolIds } = ctx.body;
    return await this.moduleService.unbindModuleSchools({
      moduleId,
      schoolIds,
    });
  }

  @Get('/binded/school_ids/:moduleId')
  @Summary('获取模块已绑定的学校ID列表')
  @Parameters({
    pathParams: Joi.object().keys({
      moduleId: Joi.string()
        .required()
        .description('模块ID'),
    }),
  })
  @PermissionWithAction('read_k12_module')
  async bindedSchoolIds(ctx: Context) {
    const { moduleId } = ctx.params;
    return await this.moduleService.getSchoolIdsByModule(moduleId);
  }

  @Post('/bind/powers/:moduleId')
  @Summary('给模块添加权限')
  @Parameters({
    pathParams: Joi.object().keys({
      moduleId: Joi.string()
        .required()
        .description('模块ID'),
    }),
    body: Joi.object().keys({
      powerIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .max(200)
        .required()
        .description('权限ID列表'),
    }),
  })
  @PermissionWithAction(['write_k12_module', 'write_k12_power'])
  async bindPowers(ctx: Context) {
    const { moduleId } = ctx.params;
    const { powerIds } = ctx.body;
    return await this.moduleService.bindPowers({
      moduleId,
      powerIds,
    });
  }

  @Delete('/unbind/powers/:moduleId')
  @Summary('给功能模块解绑权限')
  @Parameters({
    pathParams: Joi.object().keys({
      moduleId: Joi.string()
        .required()
        .description('模块ID'),
    }),
    body: Joi.object().keys({
      powerIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .max(200)
        .required()
        .description('权限ID列表'),
    }),
  })
  @PermissionWithAction(['write_k12_module', 'write_k12_power'])
  async unbindPowers(ctx: Context) {
    const { moduleId } = ctx.params;
    const { powerIds } = ctx.body;
    return await this.moduleService.unbindPowers({
      moduleId,
      powerIds,
    });
  }

  @Get('/binded/power_ids/:moduleId')
  @Summary('获取模块已绑定的权限ID列表')
  @Parameters({
    pathParams: Joi.object().keys({
      moduleId: Joi.string()
        .required()
        .description('模块ID'),
    }),
    query: Joi.object().keys({
      powerCategoryId: Joi.string()
        .required()
        .description('权限分类ID'),
    }),
  })
  @PermissionWithAction('read_k12_module')
  async bindedPowerIds(ctx: Context) {
    const { moduleId } = ctx.params;
    const { powerCategoryId } = ctx.query;
    return await this.powerService.getPowersIdsByModule({
      moduleId,
      powerCategoryId,
    });
  }
}
