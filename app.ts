import createConnection from './torm/connection';
import GraphQLServer from './tgql/server';
import { DEFAULT_DB_NAME } from './constant';
import { CodeGenerator } from './utils';

export default app => {
  const { typeorm } = app.config;
  if (!typeorm.clients) {
    typeorm.clients = {
      [DEFAULT_DB_NAME]: typeorm,
    };
  }
  app.beforeStart(async () => {
    const { connections, options } = await createConnection(app, typeorm);
    await new CodeGenerator(connections, app, {
      graphql: app.config.graphql,
      ormConfigs: options,
    }).generate();
    await new GraphQLServer(app).start();
  });
};
