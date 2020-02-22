import * as shortid from 'shortid';
import { Field, ID, Int, InterfaceType, ObjectType } from 'type-graphql';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

import { IDType } from './types';

@InterfaceType()
export abstract class BaseGraphQLObject {
  @Field(() => ID)
  id!: IDType;

  @Field() createdAt!: Date;
  @Field() createdById?: IDType;

  @Field({ nullable: true })
  updatedAt?: Date;
  @Field({ nullable: true })
  updatedById?: IDType;

  @Field({ nullable: true })
  deletedAt?: Date;
  @Field({ nullable: true })
  deletedById?: IDType;

  @Field(() => Int)
  version!: number;
}

@ObjectType({ implements: BaseGraphQLObject })
export abstract class BaseModel implements BaseGraphQLObject {
  @PrimaryColumn({ type: String })
  id!: IDType;

  @CreateDateColumn() createdAt!: Date;
  @Column() createdById!: IDType;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;
  @Column({ nullable: true })
  updatedById?: IDType;

  @Column({ nullable: true })
  deletedAt?: Date;
  @Column({ nullable: true })
  deletedById?: IDType;

  @VersionColumn() version!: number;

  getId() {
    return this.id || shortid.generate();
  }

  @BeforeInsert()
  setId() {
    this.id = this.getId();
  }
}

@ObjectType({ implements: BaseGraphQLObject })
export abstract class BaseModelUUID implements BaseGraphQLObject {
  @PrimaryGeneratedColumn('uuid')
  id!: IDType;

  @CreateDateColumn() createdAt!: Date;
  @Column() createdById!: IDType;

  @UpdateDateColumn({ nullable: true })
  updatedAt?: Date;
  @Column({ nullable: true })
  updatedById?: IDType;

  @Column({ nullable: true })
  deletedAt?: Date;
  @Column({ nullable: true })
  deletedById?: IDType;

  @VersionColumn() version!: number;
}
