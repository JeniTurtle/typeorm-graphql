import 'tsconfig-paths/register';
import { EggPlugin } from 'egg';
import * as path from 'path';

const plugin: EggPlugin = {
  cors: {
    enable: true,
    package: 'egg-cors',
  },
  redis: {
    enable: true,
    package: 'egg-redis',
  },
  nunjucks: {
    enable: true,
    package: 'egg-view-nunjucks',
  },
  rabbitmq: {
    enable: true,
    package: 'egg-rabbitmq-plus',
  },
  eureka: {
    enable: true,
    package: 'egg-eureka-plus',
  },
  typeorm_graphql: {
    enable: true,
    package: 'egg-typeorm-graphql',
  },
};

export default plugin;
