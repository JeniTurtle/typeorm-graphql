import { BaseModel, Model, StringField, IntField, ManyToOne } from 'egg-typeorm-graphql';
import { Organization } from './organization';

@Model({ database: 'accountDB' })
export class Department extends BaseModel {
  @StringField({ maxLength: 64, comment: '部门名称' })
  departmentName: string;

  @StringField({ maxLength: 64, comment: '所在地区', nullable: true })
  location?: string;

  @IntField({ comment: '部门顺序', nullable: true })
  departmentOrder?: number;

  @ManyToOne(
    _type => Department,
    department => department.supreior,
    {
      comment: '上级部门',
      nullable: true,
    },
  )
  supreior: Department;

  @ManyToOne(
    _type => Organization,
    origanization => origanization.user,
    {
      nullable: true,
      comment: '所属机构',
    },
  )
  organization?: Organization;
  organizationId?: string;
}
