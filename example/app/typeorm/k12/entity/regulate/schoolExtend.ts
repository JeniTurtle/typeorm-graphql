import { Index } from 'typeorm';
import { BaseModel, Model, EnumField, IntField } from 'egg-typeorm-graphql';

export enum K12SchoolRegulateIsInit {
  NO = 0,
  YES = 1,
}

@Model({ database: 'k12DB' })
export class K12SchoolExtend extends BaseModel {
  @Index()
  @IntField({ comment: '学校ID' })
  schoolId: number;

  @EnumField('K12SchoolRegulateIsInit', K12SchoolRegulateIsInit, {
    default: K12SchoolRegulateIsInit.YES,
    comment: '学校权限相关数据是否初始化，0否、1是',
  })
  regulateIsInit: K12SchoolRegulateIsInit;
}
