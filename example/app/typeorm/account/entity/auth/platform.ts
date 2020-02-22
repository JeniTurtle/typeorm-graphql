import { BaseModel, Model, StringField } from 'egg-typeorm-graphql';

@Model({ database: 'accountDB' })
export class Platform extends BaseModel {
  @StringField({ maxLength: 64, comment: '平台名称' })
  platformName: string;

  @StringField({ maxLength: 1024, comment: '平台介绍' })
  platformDesc: string;
}
