import { BaseModel, Model, ManyToOne } from 'egg-typeorm-graphql';
import { K12Module } from './module';
import { K12ModuleGroup } from './moduleGroup';

@Model({ database: 'k12DB' })
export class K12ModuleGroupMapping extends BaseModel {
  @ManyToOne(
    _type => K12Module,
    module => module.moduleGroupMappings,
    { comment: '模块ID', primary: true },
  )
  module: K12Module;
  moduleId: string;

  @ManyToOne(
    _type => K12ModuleGroup,
    moduleGroup => moduleGroup.moduleGroupMappings,
    { comment: '模块组ID' },
  )
  moduleGroup: K12ModuleGroup;
  moduleGroupId: string;
}
