import { BaseModel, Model, StringField, EnumField, OneToMany, ManyToOne } from 'egg-typeorm-graphql';
import { K12Power } from './power';
import { K12Application } from './application';

export enum K12PowerCategoryType {
  PERM = 0,
  NAV = 1,
}

export enum K12PowerCategoryStatus {
  NORMAL = 0,
  DISABLE = 1,
}

@Model({ database: 'k12DB' })
export class K12PowerCategory extends BaseModel {
  @StringField({ maxLength: 64, comment: '分类名称' })
  name: string;

  @StringField({ maxLength: 64, comment: '分类编号' })
  code: string;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @EnumField('K12PowerCategoryType', K12PowerCategoryType, {
    default: K12PowerCategoryType.PERM,
    comment: '类型，0权限、1导航',
  })
  type: K12PowerCategoryType;

  @EnumField('K12PowerCategoryStatus', K12PowerCategoryStatus, {
    default: K12PowerCategoryStatus.NORMAL,
    comment: '状态，0正常、1禁用',
  })
  status: K12PowerCategoryStatus;

  @ManyToOne(
    _type => K12Application,
    application => application.powerCategorys,
    {
      comment: '所属应用',
      nullable: true,
    },
  )
  application: K12Application;
  applicationId?: string;

  @OneToMany(
    _type => K12Power,
    powers => powers.category,
  )
  powers: K12Power[];
}
