/**
 * 不要问我为什么不把mudule的分类单独建个表，我就是想这么做试一下！
 * 嗯，结果就是维护起来的确很难受。。。
 */
import { BaseModel, Model, StringField, IntField, EnumField, ManyToOne, OneToMany } from 'egg-typeorm-graphql';
import { K12PowerModuleMapping } from './powerModuleMapping';
import { K12Application } from './application';
import { K12ModuleGroupMapping } from './moduleGroupMapping';
import { K12SchoolModuleMapping } from './schoolModuleMapping';

export enum K12ModuleStatus {
  NORMAL = 0,
  DISABLE = 1,
}

export enum K12ModuleIsCategory {
  NO = 0,
  YES = 1,
}

@Model({ database: 'k12DB' })
export class K12Module extends BaseModel {
  @StringField({ maxLength: 64, comment: '模块名称' })
  name: string;

  @StringField({ maxLength: 64, comment: '模块编号' })
  code: string;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @IntField({ comment: '排序', default: 0 })
  order?: number;

  @StringField({ maxLength: 64, comment: '所属分类', nullable: true })
  categoryId?: string;

  @EnumField('K12ModuleIsCategory', K12ModuleIsCategory, {
    default: K12ModuleIsCategory.NO,
    comment: '是否为分类，0否、1是',
  })
  isCategory: K12ModuleIsCategory;

  @EnumField('K12ModuleStatus', K12ModuleStatus, {
    default: K12ModuleStatus.NORMAL,
    comment: '模块状态，0正常、1禁用',
  })
  status: K12ModuleStatus;

  @ManyToOne(
    _type => K12Module,
    module => module.superior,
    {
      comment: '上级模块',
      nullable: true,
    },
  )
  superior: K12Module;
  superiorId?: string;

  @ManyToOne(
    _type => K12Application,
    application => application.moduleCategorys,
    {
      comment: '所属应用',
      nullable: true,
    },
  )
  application: K12Application;
  applicationId?: string;

  @OneToMany(
    _type => K12ModuleGroupMapping,
    mappings => mappings.module,
  )
  moduleGroupMappings: K12ModuleGroupMapping[];

  @OneToMany(
    _type => K12SchoolModuleMapping,
    mappings => mappings.module,
  )
  schoolModuleMappings: K12SchoolModuleMapping[];

  @OneToMany(
    _type => K12PowerModuleMapping,
    mapping => mapping.module,
  )
  powerModuleMappings?: K12PowerModuleMapping;
}
