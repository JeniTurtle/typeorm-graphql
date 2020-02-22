import { Get, View, Render } from 'egg-shell-plus';

@View
export default class HomeController {
  @Get()
  @Render('home')
  async index(_ctx) {
    return {
      title: '群龙之首杰尼龟',
    };
  }
}
