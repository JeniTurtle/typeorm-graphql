import { BaseModel, Model, StringField } from 'egg-typeorm-graphql';

@Model({ database: 'accountDB' })
export class Organization extends BaseModel {
  @StringField({ maxLength: 64, comment: '机构名称' })
  organizeName: string;

  @StringField({ maxLength: 64, comment: '所在地区', nullable: true })
  location?: string;
}
