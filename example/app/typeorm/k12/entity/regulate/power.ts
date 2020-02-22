import { BaseModel, Model, StringField, ManyToOne, OneToMany, EnumField, IntField } from 'egg-typeorm-graphql';
import { K12PowerCategory } from './powerCategory';
import { K12PowerModuleMapping } from './powerModuleMapping';

export enum K12PowerStatus {
  NORMAL = 0,
  DISABLE = 1,
}

@Model({ database: 'k12DB' })
export class K12Power extends BaseModel {
  @StringField({ maxLength: 128, comment: '权限名称' })
  name: string;

  @StringField({ maxLength: 256, comment: '权限编号' })
  code: string;

  @StringField({ maxLength: 512, comment: '导航地址', nullable: true })
  path: string;

  @StringField({ maxLength: 256, comment: '图标', nullable: true })
  icon: string;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @IntField({ comment: '排序', default: 0 })
  order?: number;

  @EnumField('K12PowerStatus', K12PowerStatus, {
    default: K12PowerStatus.NORMAL,
    comment: '权限状态，0正常、1禁用',
  })
  status: K12PowerStatus;

  @ManyToOne(
    _type => K12Power,
    power => power.superior,
    {
      comment: '上级权限',
      nullable: true,
    },
  )
  superior: K12Power;
  superiorId: string;

  @ManyToOne(
    _type => K12PowerCategory,
    category => category.powers,
    {
      comment: '所属分类',
    },
  )
  category: K12PowerCategory;
  categoryId: string;

  @OneToMany(
    _type => K12PowerModuleMapping,
    mapping => mapping.power,
  )
  powerModuleMappings?: K12PowerModuleMapping;
}
