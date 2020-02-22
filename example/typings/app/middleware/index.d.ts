// This file is created by egg-ts-helper@1.25.5
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportErrorHandler from '../../../app/middleware/errorHandler';
import ExportLogger from '../../../app/middleware/logger';
import ExportXml2json from '../../../app/middleware/xml2json';
import ExportGraphqlMiddlewareJwtValidate from '../../../app/middleware/graphqlMiddleware/jwtValidate';
import ExportRouterMiddlewareJwtValidate from '../../../app/middleware/routerMiddleware/jwtValidate';
import ExportRouterMiddlewareMsgTokenValidate from '../../../app/middleware/routerMiddleware/msgTokenValidate';
import ExportRouterMiddlewareRenderJson from '../../../app/middleware/routerMiddleware/renderJson';

declare module 'egg' {
  interface IMiddleware {
    errorHandler: typeof ExportErrorHandler;
    logger: typeof ExportLogger;
    xml2json: typeof ExportXml2json;
    graphqlMiddleware: {
      jwtValidate: typeof ExportGraphqlMiddlewareJwtValidate;
    }
    routerMiddleware: {
      jwtValidate: typeof ExportRouterMiddlewareJwtValidate;
      msgTokenValidate: typeof ExportRouterMiddlewareMsgTokenValidate;
      renderJson: typeof ExportRouterMiddlewareRenderJson;
    }
  }
}
