import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};

  config.development = {
    watchDirs: ['app.ts', 'agent.ts', 'lib', 'plugin'], // 开发环境监听修改文件重启服务
    ignoreDirs: ['app/graphql/generated', 'app/typeorm/account/ormconfig.ts', 'app/typeorm/k12/ormconfig.ts'], // 开发环境忽略监听修改文件重启服务
  };

  config.eureka = {
    apps: {
      configServer: {
        configFile: 'abc-dev.yml',
      },
    },
    client: {
      eureka: {
        serviceUrls: {
          default: ['http://127.0.0.1:8899/eureka/apps'],
        },
      },
    },
  };

  return config;
};
