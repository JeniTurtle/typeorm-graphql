import { Context } from 'egg';
import { Get, Controller, IgnoreJwtAll, Summary, Responses, HiddenAll } from 'egg-shell-plus';

@HiddenAll
@Controller('Eureka服务接口')
@IgnoreJwtAll // 整个控制器忽略JWT效验
export default class EurekaController {
  @Get()
  @Summary('eureka客户端信息接口')
  @Responses({ status: 200, definition: 'EurekaInfoResp' })
  async info(ctx: Context) {
    ctx.body = { name: 'account-platform', status: 'UP' };
  }

  @Get()
  @Summary('eureka心跳监听接口')
  @Responses({ status: 200, definition: 'EurekaHealthResp' })
  async health(ctx: Context) {
    ctx.body = {
      description: 'Spring Cloud Eureka Discovery Client',
      status: 'UP',
      hystrix: {
        status: 'UP',
      },
    };
  }

  @Get()
  @Summary('刷新eureka缓存')
  async refetchRegistry(ctx: Context) {
    // 刷新eureka缓存.
    ctx.app.eureka.fetchRegistry();
    ctx.body = {
      data: 'success',
    };
  }
}
