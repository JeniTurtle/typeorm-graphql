import { Args, Query, Resolver, Mutation, Arg, Ctx, ObjectType } from 'type-graphql';
import { Inject } from 'typedi';
import { Context } from 'egg';
import { PaginatedResponse } from '@graphql/type';
import { DepartmentWhereArgs, DepartmentWhereInput, DepartmentCreateInput } from '@graphql/generated';
import { Department } from '@typeorm/account/entity/auth/department';
import DepartmentService from '@service/auth/department';
import { PermissionWithAction } from '@decorator/permission';

@ObjectType({ description: '部门列表视图' })
export class DepartmentList extends PaginatedResponse(Department) {
  // 可以扩展其他字段
}

@Resolver(Department)
export class DepartmentResolver {
  @Inject()
  readonly departmentService: DepartmentService;

  @Query(() => DepartmentList)
  @PermissionWithAction('read_department')
  async departments(
    @Ctx() _ctx: Context,
    @Args() { where, orderBy, limit, offset }: DepartmentWhereArgs,
  ): Promise<DepartmentList> {
    return await this.departmentService.findAndCount<DepartmentWhereInput>({
      where,
      orderBy,
      limit,
      offset,
    });
  }

  @Mutation(() => Department)
  @PermissionWithAction('write_department')
  async createDepartment(@Arg('data') data: DepartmentCreateInput): Promise<Department> {
    return await this.departmentService.create(data);
  }
}
