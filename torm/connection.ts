import { Application } from 'egg';
import * as is from 'is-type-of';
import { Container } from 'typedi';
import { createConnections, useContainer, ConnectionOptions } from 'typeorm';

interface ITypeormConfig {
  clients: {
    [props: string]: ConnectionOptions;
  };
  [props: string]: any;
}

function handleConfig(app, config: any, env: string) {
  if (config.loggerClass && is.class(config.loggerClass)) {
    config.logger = new config.loggerClass(app, config.logging);
  }
  if (env === 'local') {
    return config;
  }
  const keys = ['entities', 'migrations', 'subscribers'];
  for (const key of keys) {
    if (config[key]) {
      const newValue = config[key].map((item: string) => item.replace(/\.ts$/, '.js'));
      config[key] = newValue;
    }
  }
  return config;
}

async function connectDB(app: Application, typeormConfig: ITypeormConfig) {
  const options: ConnectionOptions[] = [];
  for (const key in typeormConfig.clients) {
    const config = handleConfig(app, typeormConfig.clients[key], app.config.env);
    config.name = config.name || key;
    options.push(config);
  }
  const connections = await createConnections(options);
  return {
    connections,
    options,
  };
}

export default async (app: Application, typeormConfig: ITypeormConfig) => {
  if (!typeormConfig) {
    throw new Error('please config typeorm in config file');
  }
  // @ts-ignore
  const container: any = typeormConfig.container || Container;
  useContainer(container);
  try {
    const ret = await connectDB(app, typeormConfig);
    app.logger.info('[egg-typeorm] %s', '数据库链接成功');
    return ret;
  } catch (error) {
    app.logger.error('[egg-typeorm] %s', '数据库链接失败');
    throw error;
  }
};
