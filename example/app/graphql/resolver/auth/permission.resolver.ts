import { Args, Query, Resolver, Mutation, Arg, Ctx, ObjectType } from 'type-graphql';
import { Inject } from 'typedi';
import { Context } from 'egg';
import { PaginatedResponse } from '@graphql/type';
import { PermissionWhereInput, PermissionWhereArgs, PermissionCreateInput } from '@graphql/generated';
import { Permission } from '@typeorm/account/entity/auth/permission';
import PermissionService from '@service/auth/permission';
import { PermissionWithAction } from '@decorator/permission';

@ObjectType({ description: '权限列表视图' })
export class PermissionList extends PaginatedResponse(Permission) {
  // 可以扩展其他字段
}

@Resolver(Permission)
export class PermissionResolver {
  @Inject()
  protected readonly permissionService: PermissionService;

  @Query(() => PermissionList)
  @PermissionWithAction('read_permission')
  async permissions(
    @Ctx() _ctx: Context,
    @Args() { where, orderBy, limit, offset }: PermissionWhereArgs,
  ): Promise<PermissionList> {
    return await this.permissionService.findAndCount<PermissionWhereInput>({
      where,
      orderBy,
      limit,
      offset,
    });
  }

  @Mutation(() => Permission)
  @PermissionWithAction('write_permission')
  async createPermission(@Arg('data') data: PermissionCreateInput): Promise<Permission> {
    return await this.permissionService.create(data);
  }
}
