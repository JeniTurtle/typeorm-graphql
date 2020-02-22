import { EggAppConfig, PowerPartial } from 'egg';
import { Container } from 'typedi';
import { authChecker } from '../tgql/authChecker';
import { ErrorInterceptor, DataLoaderMiddleware } from '../middleware';

export default () => {
  const config = {} as PowerPartial<EggAppConfig>;

  config.typeorm = {
    container: Container,
  };

  config.graphql = {
    path: 'app/graphql',
    resolverSuffix: 'resolver', // 例：test/resolver.ts，或者 test/test.resolver.ts
    router: '/graphql',
    graphiql: true,
    generatedFolder: 'app/graphql/generated',
    resolversPath: ['app/graphql/**/*.resolver.ts'],
    schema: {
      authChecker,
      dateScalarMode: 'timestamp',
      emitSchemaFile: true,
      globalMiddlewares: [ErrorInterceptor, DataLoaderMiddleware],
    },
    apolloServer: {
      tracing: false,
      introspection: true,
      playground: {
        settings: {
          'request.credentials': 'include',
        },
      } as any,
    },
  };
  return config;
};
