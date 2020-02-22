import { onError } from 'apollo-link-error';
import { HttpLink } from 'apollo-link-http';
import * as fetch from 'cross-fetch';
import * as fs from 'fs';
import { buildSchema, GraphQLError, printSchema } from 'graphql';
import { Binding, TypescriptGenerator } from 'graphql-binding';
import { introspectSchema, makeRemoteExecutableSchema } from 'graphql-tools';
import * as path from 'path';

import { StringMapOptional } from '../torm';

interface LinkOptions extends StringMapOptional {
  token?: string;
  origin: string;
}

export class Link extends HttpLink {
  constructor(uri: string, options: LinkOptions) {
    const headers: StringMapOptional = { ...options };
    if (headers.token) {
      headers.Authorization = `Bearer ${headers.token}`;
      delete headers.token;
    }

    super({
      // TODO: cross-fetch library does not play nicely with TS
      fetch: (fetch as any) as (input: RequestInfo, init?: RequestInit) => Promise<Response>,
      headers,
      uri,
    });
  }
}

export class RemoteBinding extends Binding {
  constructor(httpLink: HttpLink, typeDefs: string) {
    // Workaround for issue with graphql-tools
    // See https://github.com/graphql-binding/graphql-binding/issues/173#issuecomment-446366548
    const errorLink = onError((args: any) => {
      if (args.graphQLErrors && args.graphQLErrors.length === 1) {
        args.response.errors = args.graphQLErrors.concat(new GraphQLError(''));
      }
    });

    const schema = makeRemoteExecutableSchema({
      link: errorLink.concat(httpLink),
      schema: typeDefs,
    });
    super({ schema });
  }
}

export async function getRemoteBinding(endpoint: string, options: LinkOptions) {
  if (!endpoint) {
    throw new Error('getRemoteBinding: endpoint is required');
  }
  const link = new Link(endpoint, options);
  const introspectionResult = await introspectSchema(link);

  return new RemoteBinding(link, printSchema(introspectionResult));
}

export async function generateBindingFile(inputSchemaPath: string, outputBindingFile: string) {
  const sdl = fs.readFileSync(path.resolve(inputSchemaPath), 'utf-8');
  const schema = buildSchema(sdl);

  const generatorOptions = {
    inputSchemaPath: path.resolve(inputSchemaPath),
    isDefaultExport: false,
    outputBindingPath: path.resolve(outputBindingFile),
    schema,
  };

  const generatorInstance = new TypescriptGenerator(generatorOptions);
  const code = generatorInstance.render();

  fs.writeFileSync(outputBindingFile, code);
}

export function getOriginalError(error: any): any {
  if (error.originalError) {
    return getOriginalError(error.originalError);
  }
  if (error.errors) {
    return error.errors.map(getOriginalError)[0];
  }
  return error;
}

export function getBindingError(err: any) {
  const error = getOriginalError(err);
  if (error && error.extensions && error.extensions.exception && error.extensions.exception.validationErrors) {
    error.extensions.exception.validationErrors.forEach((item: any) => {
      error.validationErrors = error.validationErrors || {};
      error.validationErrors[item.property] = item.constraints;
    });
  }
  return error;
}

export { Binding };
