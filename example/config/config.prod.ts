import { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {};

  config.eureka = {
    apps: {
      configServer: {
        configFile: 'abc-prod.yml',
      },
    },
    client: {
      eureka: {
        serviceUrls: {
          default: ['http://192.168.0.1:8899/eureka/apps/'],
        },
      },
    },
  };
  return config;
};
