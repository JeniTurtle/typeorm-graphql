const caller = require('caller'); // eslint-disable-line @typescript-eslint/no-var-requires
import { Field, registerEnumType } from 'type-graphql';
import { Column } from 'typeorm';

import { getMetadataStorage } from '../torm/metadataStorage';
import { composeMethodDecorators, MethodDecoratorFactory } from '../utils';

interface EnumFieldOptions {
  nullable?: boolean;
  default?: any;
  comment?: string;
}

export function EnumField(name: string, enumeration: object, options: EnumFieldOptions = {}): any {
  const commentOption = options.comment ? { comment: options.comment } : {};
  const descOption = options.comment ? { description: options.comment } : {};
  const defaultValueOptions = options.default !== undefined ? { defaultValue: options.default } : {};
  const defaultOptions = options.default !== undefined ? { default: options.default } : {};
  const factories: any = [];

  // Register enum with TypeGraphQL so that it lands in generated schema
  registerEnumType(enumeration, { name });

  // In order to use the enums in the generated classes file, we need to
  // save their locations and import them in the generated file
  const decoratorSourceFile = caller();

  const registerEnumWithWarthog = (target: any, propertyKey: string): any => {
    getMetadataStorage().addEnum(target.constructor.name, propertyKey, name, enumeration, decoratorSourceFile);
  };

  factories.push(
    registerEnumWithWarthog,
    Field(() => enumeration, { ...options, ...descOption, ...defaultValueOptions }),
    Column({ enum: enumeration, ...options, ...commentOption, ...defaultOptions }) as MethodDecoratorFactory,
  );

  return composeMethodDecorators(...factories);
}
