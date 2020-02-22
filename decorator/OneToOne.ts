import * as is from 'is-type-of';
import { Field } from 'type-graphql';
import { OneToOne as TypeORMOneToOne, JoinColumn } from 'typeorm';
import { StringField } from './StringField';
import { composeMethodDecorators, MethodDecoratorFactory } from '../utils';

export function OneToOne(parentType: any, joinFunc: any, options: any = {}): any {
  if (is.object(joinFunc)) {
    options = joinFunc;
    joinFunc = undefined;
  }
  const descOption = options.comment ? { description: options.comment } : {};
  let klass: string;
  const extractClassName = (target: any): any => {
    klass = target.constructor.name;
  };
  const createForeignKeyField = (target: any, propertyKey: string, descriptor: PropertyDescriptor): any => {
    klass = target.constructor.name;
    Reflect.defineProperty(target, `${klass}Id`, {});
    StringField(options)(target, `${propertyKey}Id`, descriptor);
  };
  const graphQLdecorator = options.skipGraphQLField
    ? []
    : [Field(parentType, { nullable: true, ...options, ...descOption }) as MethodDecoratorFactory]; // TODO: This should not be nullable by default

  const factories = [
    extractClassName,
    ...graphQLdecorator,
    Field(parentType, { nullable: true, ...options, ...descOption }) as MethodDecoratorFactory,
    TypeORMOneToOne(parentType, joinFunc) as MethodDecoratorFactory,
    JoinColumn() as MethodDecoratorFactory,
    createForeignKeyField,
  ];

  return composeMethodDecorators(...factories);
}
