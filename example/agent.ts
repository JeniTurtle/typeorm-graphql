import Sentry = require('@sentry/node');
import { Agent } from 'egg';
import { saveRemoteConfig, initConfig } from './lib/configHandler';

export default class AgentBootHook {
  constructor(private readonly agent: Agent) {}

  async initSentry() {
    Sentry.init({
      environment: this.agent.config.env,
      dsn: 'http://bf825b72684b4fd4a081514e88e51c42@sentry.test.com.cn/16',
    });
    this.agent.sentry = Sentry;
    // 注册上报异常事件
    this.agent.messenger.on('SentryCaptureException', (err: { message: string, stack: string }) => {
      const error = new Error(err.message);
      error.stack = err.stack;
      this.agent.sentry.captureException(error);
    });
  }

  async didReady() {
    // 把springCloud远程配置保存到临时文件，供appWorker调用。
    await saveRemoteConfig(this.agent);
    // 从临时文件中读取agentWorker保存的远程配置文件，并修改当前项目中的config文件。
    initConfig(this.agent);
    // 初始化sentry
    this.initSentry();
  }
}
