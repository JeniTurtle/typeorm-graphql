import { Min } from 'class-validator';
import { ArgsType, Field, Int } from 'type-graphql';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true })
  @Min(0)
  offset?: number;

  @Field(() => Int, { nullable: true })
  @Min(1)
  limit?: number = 50;
}
