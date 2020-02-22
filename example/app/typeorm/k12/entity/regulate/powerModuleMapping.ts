import { BaseModel, Model, ManyToOne } from 'egg-typeorm-graphql';
import { K12Module } from './module';
import { K12Power } from './power';

@Model({ database: 'k12DB' })
export class K12PowerModuleMapping extends BaseModel {
  @ManyToOne(
    _type => K12Module,
    module => module.powerModuleMappings,
    { comment: '模块ID', primary: true },
  )
  module: K12Module;
  moduleId: string;

  @ManyToOne(
    _type => K12Power,
    power => power.powerModuleMappings,
    { comment: '权限ID' },
  )
  power: K12Power;
  powerId: string;
}
