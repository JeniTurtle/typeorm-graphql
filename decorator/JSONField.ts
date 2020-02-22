// eslint-disable-next-line @typescript-eslint/no-var-requires
const { GraphQLJSONObject } = require('graphql-type-json');

import { Field } from 'type-graphql';
import { Column } from 'typeorm';

import { composeMethodDecorators, MethodDecoratorFactory } from '../utils';

import defaultColumnType from '../torm/defaultColumnType';

interface JSONFieldOptions {
  nullable?: boolean;
  comment?: string;
  default?: any;
}

export function JSONField(args: JSONFieldOptions = {}): any {
  const nullableOption = args.nullable === true ? { nullable: true } : {};
  const commentOption = args.comment ? { comment: args.comment } : {};
  const descOption = args.comment ? { description: args.comment } : {};
  const defaultOption = args.default !== undefined ? { default: args.default } : {};
  const defaultValueOptions = args.default !== undefined ? { defaultValue: args.default } : {};
  const type = defaultColumnType('postgres', 'json');

  // These are the 2 required decorators to get type-graphql and typeorm working
  const factories = [
    Field(() => GraphQLJSONObject, {
      ...nullableOption,
      ...descOption,
      ...defaultValueOptions,
    }),
    Column({
      type,
      ...nullableOption,
      ...commentOption,
      ...defaultOption,
    }) as MethodDecoratorFactory,
  ];

  return composeMethodDecorators(...factories);
}
