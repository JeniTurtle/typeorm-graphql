import { BaseModel, Model, StringField, EnumField, OneToMany } from 'egg-typeorm-graphql';
import { K12Module } from './module';
import { K12PowerCategory } from './powerCategory';

export enum K12ApplicationStatus {
  NORMAL = 0,
  DISABLE = 1,
}

@Model({ database: 'k12DB' })
export class K12Application extends BaseModel {
  @StringField({ maxLength: 64, comment: '应用名称' })
  name: string;

  @StringField({ maxLength: 64, comment: '应用编号' })
  code: string;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @EnumField('K12ApplicationStatus', K12ApplicationStatus, {
    default: K12ApplicationStatus.NORMAL,
    comment: '应用状态，0正常、1禁用',
  })
  status: K12ApplicationStatus;

  @OneToMany(
    _type => K12Module,
    moduleCategorys => moduleCategorys.application,
  )
  moduleCategorys: K12Module[];

  @OneToMany(
    _type => K12PowerCategory,
    powerCategorys => powerCategorys.application,
  )
  powerCategorys: K12PowerCategory[];
}
