import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { WxTemplateLibrary } from '@typeorm/account/entity/wechat/templateLibrary';
import TemplateSettingService from '@service/wechat/templateSetting';

@Service()
export default class WxTemplateLibraryService extends BaseService<WxTemplateLibrary> {
  @Inject()
  protected readonly templateSetService: TemplateSettingService;

  constructor(@InjectRepository(WxTemplateLibrary) readonly repository: Repository<WxTemplateLibrary>) {
    super(WxTemplateLibrary, repository);
  }

  /**
   * 判断该模板是否可以更改或删除
   * @param id
   */
  async checkUsed(id: string): Promise<number | never> {
    const { TEMPLATE_LIBRARY_ALREADY_USERD_ERROR, TEMPLATE_LIBRARY_NOT_EXISTS_ERROR } = this.ctx.app.exception.template;
    const templateLib = await this.findById(id);
    if (!templateLib) {
      this.ctx.error(TEMPLATE_LIBRARY_NOT_EXISTS_ERROR);
    }
    const count = await this.templateSetService.count({
      templateShortId: templateLib.templateShortId,
    });
    if (count > 0) {
      this.ctx.error(TEMPLATE_LIBRARY_ALREADY_USERD_ERROR);
    }
    return count;
  }
}
