import { Index } from 'typeorm';
import { BaseModel, Model, ManyToOne, IntField } from 'egg-typeorm-graphql';
import { K12Module } from './module';

@Model({ database: 'k12DB' })
export class K12SchoolModuleMapping extends BaseModel {
  @Index()
  @IntField({ comment: '学校ID' })
  schoolId: number;

  @ManyToOne(
    _type => K12Module,
    module => module.schoolModuleMappings,
    { comment: '模块ID' },
  )
  module: K12Module;
  moduleId: string;
}
