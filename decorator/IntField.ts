import { Field, Int } from 'type-graphql';
import { Column } from 'typeorm';

import { composeMethodDecorators, MethodDecoratorFactory } from '../utils';

interface IntFieldOptions {
  nullable?: boolean;
  comment?: string;
  default?: number;
  primary?: boolean;
}

export function IntField(args: IntFieldOptions = {}): any {
  const defaultOption = args.default !== undefined ? { default: args.default } : {};
  const defaultValueOptions = args.default !== undefined ? { defaultValue: args.default } : {};
  const nullableOption = args.nullable === true ? { nullable: true } : {};
  const commentOption = args.comment ? { comment: args.comment } : {};
  const descOption = args.comment ? { description: args.comment } : {};

  const factories = [
    Field(() => Int, {
      ...nullableOption,
      ...descOption,
      ...defaultValueOptions,
    }),
    Column({
      type: 'int',
      primary: args.primary,
      ...nullableOption,
      ...commentOption,
      ...defaultOption,
    }) as MethodDecoratorFactory,
  ];

  return composeMethodDecorators(...factories);
}
