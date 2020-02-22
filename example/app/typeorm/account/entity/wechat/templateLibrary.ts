import { Index } from 'typeorm';
import { BaseModel, Model, StringField } from 'egg-typeorm-graphql';

@Model({ database: 'accountDB' })
export class WxTemplateLibrary extends BaseModel {
  @Index()
  @StringField({ maxLength: 64, comment: '模板库中模板的编号，有“TM**”和“OPENTMTM**”等形式' })
  templateShortId: string;

  @StringField({ maxLength: 64, comment: '模板消息名称' })
  templateName: string;
}
