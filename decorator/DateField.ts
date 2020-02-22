import { Field, GraphQLISODateTime } from 'type-graphql';
import { Column } from 'typeorm';

import { composeMethodDecorators, MethodDecoratorFactory } from '../utils';
import defaultColumnType from '../torm/defaultColumnType';

interface DateFieldOptions {
  nullable?: boolean;
  default?: Date;
  comment?: string;
}

export function DateField(args: DateFieldOptions = {}): any {
  const nullableOption = args.nullable === true ? { nullable: true } : {};
  const defaultOption = args.default !== undefined ? { default: args.default } : {};
  const defaultValueOptions = args.default !== undefined ? { defaultValue: args.default } : {};
  const commentOption = args.comment ? { comment: args.comment } : {};
  const descOption = args.comment ? { description: args.comment } : {};
  const type = defaultColumnType('postgres', 'date');

  // These are the 2 required decorators to get type-graphql and typeorm working
  const factories = [
    Field(() => GraphQLISODateTime, {
      ...nullableOption,
      ...descOption,
      ...defaultValueOptions,
    }),
    Column({
      type,
      ...nullableOption,
      ...defaultOption,
      ...commentOption,
    }) as MethodDecoratorFactory,
  ];

  return composeMethodDecorators(...factories);
}
