import * as Joi from 'joi';
import { Context } from 'egg';
import { Post, Put, Delete, Get, Controller, Summary, Parameters } from 'egg-shell-plus';
import { Inject } from 'typedi';
import ApplicationService from '@service/k12/regulate/application';
import { PermissionWithAction } from '@decorator/permission';
import { K12ApplicationStatus } from '@typeorm/k12/entity/regulate/application';

const mutateAppParams = {
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
  status: Joi.number()
    .integer()
    .valid(K12ApplicationStatus.NORMAL, K12ApplicationStatus.DISABLE)
    .default(K12ApplicationStatus.NORMAL)
    .description('状态，0正常；1禁用'),
};

@Controller('云平台应用管理')
export default class ApplicationController {
  @Inject()
  private appService: ApplicationService;

  @Get()
  @Summary('获取应用列表')
  @PermissionWithAction('read_k12_application')
  async list(_ctx: Context) {
    return await this.appService.find();
  }

  @Post()
  @Summary('新增应用')
  @Parameters({
    body: Joi.object().keys({
      ...mutateAppParams,
    }),
  })
  @PermissionWithAction('write_k12_application')
  async create(ctx: Context) {
    await this.appService.inspectCode(ctx.body.code);
    return await this.appService.create(ctx.body);
  }

  @Put('/update/:id')
  @Summary('修改应用')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('应用ID'),
    }),
    body: Joi.object().keys({
      ...mutateAppParams,
    }),
  })
  @PermissionWithAction('write_k12_application')
  async update(ctx: Context) {
    const { id } = ctx.params;
    await this.appService.inspectCode(ctx.body.code, id);
    return await this.appService.updateById(ctx.body, id);
  }

  @Delete('/delete/:id')
  @Summary('删除应用')
  @Parameters({
    pathParams: Joi.object().keys({
      id: Joi.string()
        .required()
        .description('应用ID'),
    }),
  })
  @PermissionWithAction('write_k12_application')
  async delete(ctx: Context) {
    const { id } = ctx.params;
    return await this.appService.deleteApp(id);
  }
}
