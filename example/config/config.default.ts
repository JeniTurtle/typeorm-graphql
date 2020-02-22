import { address } from 'ip';
import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { SnakeNamingStrategy } from 'egg-typeorm-graphql';
import OrmLogger from '@lib/typeormLogger';
import jwtValidate from '@middleware/graphqlMiddleware/jwtValidate';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;
  const ip = address('public', 'ipv4');
  const port = 7021; // 这里端口要与package.json中start命令指定的port参数一致。

  config.port = port;

  config.keys = appInfo.name + '_15536723820306_9803';

  config.logger = {
    dir: '/home/logs/account-platform',
  };

  config.customs = {
    prodHost: 'http://www.test.com.cn',
  };

  config.security = {
    // 关闭csrf
    csrf: {
      enable: false,
    },
  };

  config.static = {
    prefix: '/public/',
    maxAge: 31536000,
  };

  config.view = {
    defaultViewEngine: 'nunjucks',
    defaultExtension: '.html',
  };

  config.wechat = {
    server: {
      globalToken: 'jijifujiji', // 所有微信公众号服务器token都要配置这个
    },
  };

  // 覆盖egg自带的bodyParser配置
  config.bodyParser = {
    enable: true,
    encoding: 'utf8',
    formLimit: '100kb',
    jsonLimit: '100kb',
    strict: true,
    queryString: {
      arrayLimit: 100,
      depth: 5,
      parameterLimit: 1000,
    },
    enableTypes: ['json', 'form', 'text'],
    extendTypes: {
      text: ['text/xml', 'application/xml'],
    },
  };

  // 跨域设置，允许所有域名
  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  // egg全局中间件, 注: 所有中间件首字母都是小写哦
  config.middleware = ['logger', 'errorHandler', 'xml2json'];

  // 自定义中间件层级从外到里的顺序依次是:
  // router before -> controller before -> action before -> action after -> controller after -> router after
  // 测试路径: /demo/weglogic

  // 执行在所有控制器之前
  config.routerBeforeMiddleware = ['routerMiddleware.jwtValidate'];
  // 执行在所有控制器之后
  config.routerAfterMiddleware = ['routerMiddleware.renderJson'];

  // 中间件配置方式
  // 中间件多级目录, 需要加一级文件夹名字, 注册的时候也需要带上,
  // 比如 @Before('RouterMiddleware.TestActAfter')
  // 或者 config.routerAfterMiddleware = ['routerMiddleware.testActAfter'];

  // egg-shell-plus 配置
  config.eggShell = {
    defaultIndex: '/home', // 设置默认首页, 之所以不设置index.ts作为入口目录, 是怕index控制器下面的action会污染全局地址
    jwtValidationName: 'routerMiddleware.jwtValidate', // 配置jwt效验的中间件名, 可以设置@ignoreJwt或@ignoreJwtAll来跳过该效验
    urlNamingStrategy: 'underline', // url格式自动转换为下划线格式
    swaggerOpt: {
      open: true,
      title: '用户权限管理接口文档',
      version: '1.0.0',
      // 注意, definition的路径跟controller的路径做了强绑定, 为了确保名字不会冲突。
      definitionPath: './app/definition',
    },
  };

  config.authorize = {
    jwt: {
      secret: 'Knows123!@#',
      sign: {
        expiresIn: 30 * 24 * 3600, // jwt过期时间
      },
      verify: {},
      decode: {},
    },
    login: {
      expireTime: 30 * 24 * 3600, // 登陆过期时间
    },
  };

  config.eureka = {
    apps: {
      k12NodeServer: {
        name: 'K12-NODE-SERVER',
      },
      configServer: {
        name: 'CONFIG-SERVER',
        basicAuth: {
          username: 'admin',
          password: 'admin',
        },
      },
    },
    client: {
      instance: {
        instanceId: `${ip}:${port}`,
        app: 'K12-NODE-ACCOUNT',
        hostName: ip,
        ipAddr: ip,
        statusPageUrl: `http://${ip}:${port}/api/eureka/info`, // spring admin 注册心跳
        healthCheckUrl: `http://${ip}:${port}/api/eureka/health`, // eureka 注册心跳
        port: {
          $: port,
          '@enabled': 'true',
        },
        vipAddress: 'K12-NODE-ACCOUNT',
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn',
        },
        metadata: {
          refetchRegistryUrl: `http://${ip}:${port}/api/eureka/refetch_registry`,
        },
      },
      eureka: {
        registryFetchInterval: 30000,
      },
    },
  };

  // @ts-ignore
  config.redis = {
    client: {
      port: '${redis.port}', // 从springCloud配置中取
      host: '${redis.host}',
      password: '${redis.password}',
      db: 7,
    },
  };

  config.typeorm = {
    clients: {
      accountDB: {
        type: 'postgres',
        host: '${database.host}',
        port: '${database.port}',
        username: '${database.username}',
        password: '${database.password}',
        database: 'account_platform',
        migrationsRun: false,
        synchronize: false,
        logging: 'all',
        loggerClass: OrmLogger,
        maxQueryExecutionTime: 1500, // 慢查询记录
        entityPrefix: 'mp_',
        namingStrategy: new SnakeNamingStrategy(),
        entities: ['app/typeorm/account/entity/**/*.ts'],
        migrations: ['app/typeorm/account/migration/**/*.ts'],
        subscribers: ['app/typeorm/account/subscriber/**/*.ts'],
        cli: {
          generatedOrmConfigDir: 'app/typeorm/account/',
          entitiesDir: 'app/typeorm/account/entity',
          migrationsDir: 'app/typeorm/account/migration',
          subscribersDir: 'app/typeorm/account/subscriber',
        },
      },
      k12DB: {
        type: 'postgres',
        host: '${database.host}',
        port: '${database.port}',
        username: '${database.username}',
        password: '${database.password}',
        database: 'dev_place',
        migrationsRun: false,
        synchronize: false,
        logging: 'all',
        loggerClass: OrmLogger,
        maxQueryExecutionTime: 1500, // 慢查询记录
        entityPrefix: 'ac_',
        namingStrategy: new SnakeNamingStrategy(),
        entities: ['app/typeorm/k12/entity/**/*.ts'],
        migrations: ['app/typeorm/k12/migration/**/*.ts'],
        subscribers: ['app/typeorm/k12/subscriber/**/*.ts'],
        cli: {
          generatedOrmConfigDir: 'app/typeorm/k12',
          entitiesDir: 'app/typeorm/k12/entity',
          migrationsDir: 'app/typeorm/k12/migration',
          subscribersDir: 'app/typeorm/k12/subscriber',
        },
      },
    },
  };

  config.graphql = {
    graphiql: true,
    middlewares: [jwtValidate],
    schema: {
      emitSchemaFile: false,
    },
    generatedFolder: 'app/graphql/generated',
    resolversPath: ['app/graphql/**/*.resolver.ts'],
    maxComplexity: 200, // 最大复杂度，按字段数量来，防止恶意复杂查询，用于造成DDOS攻击
    apolloServer: {
      tracing: true,
      introspection: true,
      playground: {
        settings: {
          'request.credentials': 'include',
        },
      } as any,
    },
  };

  config.rabbitmq = {
    client: {
      url: {
        protocol: 'amqp',
        hostname: '${rabbitmq.host}',
        port: '${rabbitmq.port}',
        username: '${rabbitmq.username}',
        password: '${rabbitmq.password}',
        locale: 'en_US',
        frameMax: 0,
        heartbeat: 0,
        vhost: '${rabbitmq.virtual-host}',
      },
      reconnectTime: 5000, // 重连时间间隔
      options: {},
      exchanges: {
        messageExchange: {
          name: 'message_exchange', // 消息推送交换机
          type: 'direct',
          options: {
            durable: true,
          },
        },
        messageCallbackExchange: {
          name: 'message_callback_exchange', // 消息推送交换机
          type: 'fanout',
          options: {
            durable: true,
          },
        },
        delayMessageExchange: {
          name: 'delay_message_exchange', // 延迟消息交换机
          type: 'direct',
          options: {
            durable: true,
          },
        },
        dlxMessageExchange: {
          name: 'dlx_message_exchange', // 消息失败的死信交换机
          type: 'direct',
          options: {
            durable: true,
          },
        },
      },
      queues: {
        messageQueue: {
          // 推送消息队列
          exchange: 'message_exchange',
          name: 'message_queue',
          keys: {
            wechatTemplateMessage: 'wechat/message/template',
          },
          options: {
            exclusive: false,
            durable: true,
            maxPriority: 10,
            deadLetterRoutingKey: 'wechat/message/template',
            deadLetterExchange: 'dlx_message_exchange',
          },
          autoSubscribe: true, // 启动时自动开启订阅。
          subscribeOptions: {}, // 开启自动订阅时的消费者配置，不开启不用配置
        },
        dlxMessageQueue: {
          // 推送失败的队列，目前不做失败后的处理
          exchange: 'dlx_message_exchange',
          name: 'dlx_message_queue',
          keys: {
            wechatTemplateMessage: 'wechat/message/template', // 这里是deadLetterRoutingKey
          },
          options: {
            exclusive: false,
            durable: true,
            maxPriority: 10,
            maxLength: 10000,
          },
          autoSubscribe: false, // 关闭自动订阅。
          subscribeOptions: {}, // 开启自动订阅时的消费者配置，不开启不用配置
        },
        delayMessageQueue: {
          // 延迟推送消息队列，这里不做消费处理，定时超时后，转发给message_exchange
          exchange: 'delay_message_exchange',
          name: 'delay_message_queue',
          keys: {
            wechatTemplateMessage: 'wechat/message/template',
          },
          options: {
            exclusive: false,
            durable: true,
            maxPriority: 10,
            deadLetterRoutingKey: 'wechat/message/template',
            deadLetterExchange: 'message_exchange',
          },
          autoSubscribe: false, // 关闭自动订阅。
          subscribeOptions: {}, // 开启自动订阅时的消费者配置，不开启不用配置
        },
      },
    },
  };

  return {
    ...config,
  };
};
