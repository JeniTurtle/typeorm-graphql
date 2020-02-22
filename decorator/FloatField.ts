import { Field, Float } from 'type-graphql';
import { Column } from 'typeorm';

import { composeMethodDecorators, MethodDecoratorFactory } from '../utils';
import defaultColumnType from '../torm/defaultColumnType';

interface FloatFieldOptions {
  nullable?: boolean;
  comment?: string;
  default?: number;
}

export function FloatField(args: FloatFieldOptions = {}): any {
  const nullableOption = args.nullable === true ? { nullable: true } : {};
  const defaultOption = args.default !== undefined ? { default: args.default } : {};
  const defaultValueOptions = args.default !== undefined ? { defaultValue: args.default } : {};
  const commentOption = args.comment ? { comment: args.comment } : {};
  const descOption = args.comment ? { description: args.comment } : {};
  const type = defaultColumnType('postgres', 'float');

  // These are the 2 required decorators to get type-graphql and typeorm working
  const factories = [
    Field(() => Float, {
      ...nullableOption,
      ...descOption,
      ...defaultValueOptions,
    }),
    Column({
      // This type will be different per database driver
      type,
      ...nullableOption,
      ...commentOption,
      ...defaultOption,
    }) as MethodDecoratorFactory,
  ];

  return composeMethodDecorators(...factories);
}
