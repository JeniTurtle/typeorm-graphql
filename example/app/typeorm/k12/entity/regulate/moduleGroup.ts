import { Index } from 'typeorm';
import { BaseModel, Model, StringField, IntField, EnumField, OneToMany, ManyToOne } from 'egg-typeorm-graphql';
import { K12ModuleGroupMapping } from './moduleGroupMapping';
import { K12UserModuleGroupMapping } from './userModuleGroupMapping';
import { K12RoleGroup } from './roleGroup';

export enum K12ModuleGroupStatus {
  NORMAL = 0,
  DISABLE = 1,
}

export enum K12ModuleGroupSystemDefault {
  NO = 0,
  YES = 1,
}

export enum K12ModuleGroupSchoolDefault {
  NO = 0,
  YES = 1,
}

export enum K12ModuleGroupNewUserDefault {
  NO = 0,
  YES = 1,
}

@Model({ database: 'k12DB' })
export class K12ModuleGroup extends BaseModel {
  @StringField({ maxLength: 64, comment: '角色名称' })
  name: string;

  @StringField({ maxLength: 64, comment: '角色编号' })
  code: string;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @IntField({ comment: '角色级别' })
  level?: number;

  @Index()
  @IntField({ comment: '学校ID' })
  schoolId: number;

  @EnumField('K12ModuleGroupStatus', K12ModuleGroupStatus, {
    default: K12ModuleGroupStatus.NORMAL,
    comment: '角色状态，0正常、1禁用',
  })
  status: K12ModuleGroupStatus;

  @EnumField('K12ModuleGroupSystemDefault', K12ModuleGroupSystemDefault, {
    default: K12ModuleGroupSystemDefault.NO,
    comment: '是否为系统角色，0否、1是',
  })
  systemDefault: K12ModuleGroupSystemDefault;

  @EnumField('K12ModuleGroupSchoolDefault', K12ModuleGroupSchoolDefault, {
    default: K12ModuleGroupSchoolDefault.NO,
    comment: '是否为学校角色，0否、1是',
  })
  schoolDefault: K12ModuleGroupSchoolDefault;

  @EnumField('K12ModuleGroupNewUserDefault', K12ModuleGroupNewUserDefault, {
    default: K12ModuleGroupSchoolDefault.NO,
    comment: '是否为新用户角色，0否、1是',
  })
  newUserDefault: K12ModuleGroupNewUserDefault;

  @ManyToOne(
    _type => K12RoleGroup,
    roleGroup => roleGroup.moduleGroup,
    { comment: '角色组ID' },
  )
  roleGroup: K12RoleGroup;
  roleGroupId: string;

  @ManyToOne(
    _type => K12ModuleGroup,
    moduleGroup => moduleGroup.original,
    {
      comment: '原始ID',
      nullable: true,
    },
  )
  original: K12ModuleGroup;
  originalId?: string;

  @OneToMany(
    _type => K12ModuleGroupMapping,
    mappings => mappings.moduleGroup,
  )
  moduleGroupMappings: K12ModuleGroupMapping[];

  @OneToMany(
    _type => K12UserModuleGroupMapping,
    mappings => mappings.moduleGroup,
  )
  userModuleGroupMappings: K12UserModuleGroupMapping[];
}
