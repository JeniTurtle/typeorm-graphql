import { Index } from 'typeorm';
import { BaseModel, Model, StringField, IntField, OneToMany, ManyToOne } from 'egg-typeorm-graphql';
import { K12Module } from './module';
import { K12ModuleGroup } from './moduleGroup';

@Model({ database: 'k12DB' })
export class K12RoleGroup extends BaseModel {
  @StringField({ maxLength: 64, comment: '角色组名称' })
  name: string;

  @StringField({ maxLength: 64, comment: '角色组编号' })
  code: string;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @Index()
  @IntField({ comment: '学校ID' })
  schoolId: number;

  @StringField({ maxLength: 1024, comment: '模块分类ID列表', nullable: true })
  moduleCategoryIds: string;

  @ManyToOne(
    _type => K12RoleGroup,
    roleGroup => roleGroup.original,
    {
      comment: '原始ID',
      nullable: true,
    },
  )
  original: K12RoleGroup;
  originalId?: string;

  @OneToMany(
    _type => K12ModuleGroup,
    moduleGroup => moduleGroup.roleGroup,
  )
  moduleGroup: K12ModuleGroup[];
}
