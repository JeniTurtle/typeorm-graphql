import {SnakeNamingStrategy} from 'egg-typeorm-graphql';
      const config = {"type":"postgres","host":"10.0.0.110","port":"5460","username":"postgres","password":"postgres","database":"account_platform","migrationsRun":false,"synchronize":false,"logging":"all","maxQueryExecutionTime":1500,"entityPrefix":"mp_","namingStrategy":{},"entities":["app/typeorm/account/entity/**/*.js"],"migrations":["app/typeorm/account/migration/**/*.ts"],"subscribers":["app/typeorm/account/subscriber/**/*.ts"],"cli":{"generatedOrmConfigDir":"app/typeorm/account/","entitiesDir":"app/typeorm/account/entity","migrationsDir":"app/typeorm/account/migration","subscribersDir":"app/typeorm/account/subscriber"},"autoGenerateFiles":true,"logger":"advanced-console","name":"accountDB"};
      config.namingStrategy = new SnakeNamingStrategy();
      module.exports = config;