import { Service } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { WxTemplateSetting } from '@typeorm/account/entity/wechat/templateSetting';

@Service()
export default class WxTemplateSettingService extends BaseService<WxTemplateSetting> {
  constructor(@InjectRepository(WxTemplateSetting) readonly repository: Repository<WxTemplateSetting>) {
    super(WxTemplateSetting, repository);
  }
}
