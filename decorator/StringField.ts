import { MaxLength, MinLength } from 'class-validator';
import { Field } from 'type-graphql';
import { Column } from 'typeorm';

import { composeMethodDecorators, MethodDecoratorFactory } from '../utils';

interface StringFieldOptions {
  maxLength?: number;
  minLength?: number;
  nullable?: boolean;
  unique?: boolean;
  comment?: string;
  default?: string;
}

export function StringField(args: StringFieldOptions = {}): any {
  const nullableOption = args.nullable === true ? { nullable: true } : {};
  const maxLenOption = args.maxLength ? { length: args.maxLength } : {};
  const uniqueOption = args.unique ? { unique: true } : {};
  const commentOption = args.comment ? { comment: args.comment } : {};
  const descOption = args.comment ? { description: args.comment } : {};
  const defaultOption = args.default !== undefined ? { default: args.default } : {};
  const defaultValueOptions = args.default !== undefined ? { defaultValue: args.default } : {};

  // These are the 2 required decorators to get type-graphql and typeorm working
  const factories = [
    // We explicitly say string here because when we're metaprogramming without
    // TS types, Field does not know that this should be a String
    Field(() => String, {
      ...nullableOption,
      ...descOption,
      ...defaultValueOptions,
    }),
    Column({
      type: 'varchar',
      ...maxLenOption,
      ...nullableOption,
      ...uniqueOption,
      ...commentOption,
      ...defaultOption,
    }) as MethodDecoratorFactory,
  ];

  if (args.minLength) {
    factories.push(MinLength(args.minLength));
  }
  if (args.maxLength) {
    factories.push(MaxLength(args.maxLength));
  }

  return composeMethodDecorators(...factories);
}
