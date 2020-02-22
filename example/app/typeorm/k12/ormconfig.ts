import {SnakeNamingStrategy} from 'egg-typeorm-graphql';
      const config = {"type":"postgres","host":"10.0.0.110","port":"5460","username":"postgres","password":"postgres","database":"dev_place","migrationsRun":false,"synchronize":false,"logging":"all","maxQueryExecutionTime":1500,"entityPrefix":"ac_","namingStrategy":{},"entities":["app/typeorm/k12/entity/**/*.js"],"migrations":["app/typeorm/k12/migration/**/*.ts"],"subscribers":["app/typeorm/k12/subscriber/**/*.ts"],"cli":{"generatedOrmConfigDir":"app/typeorm/k12","entitiesDir":"app/typeorm/k12/entity","migrationsDir":"app/typeorm/k12/migration","subscribersDir":"app/typeorm/k12/subscriber"},"autoGenerateFiles":true,"logger":"advanced-console","name":"k12DB"};
      config.namingStrategy = new SnakeNamingStrategy();
      module.exports = config;