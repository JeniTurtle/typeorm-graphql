import * as path from 'path';
import * as is from 'is-type-of';
import { Application } from 'egg';
import { Container } from 'typedi';

export const startTask = (app: Application) => {
  // 加载单进程任务文件夹
  const taskDir = path.join(app.config.baseDir, 'app/task');
  app.loader.loadToApp(taskDir, 'task');
  // @ts-ignore
  const tasks = app.task;
  Object.getOwnPropertyNames(tasks).map(async key => {
    if (is.class(tasks[key])) {
      const instance = Container.get<SingleProgressTask>(tasks[key]).init(app);
      await instance.run();
    }
  });
};

export abstract class SingleProgressTask {
  public app: Application;
  public disable = false;
  private redisKey = 'single_progress_task_';
  private isInit = false;

  init(app: Application) {
    this.redisKey += this.constructor.name;
    this.app = app;
    this.isInit = true;
    return this;
  }

  async run() {
    if (this.disable) {
      return;
    }
    if (!this.isInit) {
      throw new Error('Task uninitialized!');
    }
    // 设置redis标记
    const ret = await this.app.redis.setnx(this.redisKey, new Date().getTime());
    if (ret === 1) {
      // 设置10分钟过期时间
      await this.app.redis.expire(this.redisKey, 60 * 10);
      await this.task(this.app);
    }
  }

  abstract async task(app: Application);
}
