import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};

  config.eureka = {
    apps: {
      configServer: {
        configFile: 'abc-test.yml',
      },
    },
    client: {
      eureka: {
        serviceUrls: {
          default: ['http://127.0.0.1:8899/eureka/apps/'],
        },
      },
    },
  };

  return config;
};
