import * as Joi from 'joi';
import { Context } from 'egg';
import { Post, Get, Put, Delete, Controller, Summary, Parameters, Description } from 'egg-shell-plus';
import { Inject } from 'typedi';
import { PermissionIsCategory } from '@typeorm/account/entity/auth/permission';
import PermService from '@service/auth/permission';
import UserService from '@service/auth/user';
import RoleService from '@service/auth/role';
import { PermissionWithAction } from '@decorator/permission';

const createPermissionParams = Joi.object().keys({
  name: Joi.string()
    .required()
    .description('权限名称'),
  code: Joi.string()
    .required()
    .description('权限编号'),
  remark: Joi.string().description('权限备注'),
  isCategory: Joi.number()
    .integer()
    .valid(PermissionIsCategory.YES, PermissionIsCategory.NO)
    .description('是否是分类，1是，0不是'),
  supreiorId: Joi.string().description('上级ID'),
});

@Controller('对外开放的权限管理接口')
export default class PermissionController {
  @Inject()
  readonly permService: PermService;

  @Inject()
  readonly userService: UserService;

  @Inject()
  readonly roleService: RoleService;

  /**
   * 获取权限列表
   * @param ctx
   */
  @Get()
  @Summary('权限列表接口')
  @Parameters({
    query: Joi.object().keys({
      pageIndex: Joi.number()
        .integer()
        .min(1)
        .required()
        .description('当前页码'),
      pageSize: Joi.number()
        .integer()
        .min(1)
        .required()
        .description('每页记录数'),
      isCategoryEq: Joi.number()
        .integer()
        .valid(PermissionIsCategory.YES, PermissionIsCategory.NO)
        .description('是否是分类'),
      nameContains: Joi.string().description('权限名称，模糊匹配'),
      codeContains: Joi.string().description('权限编号，模糊匹配'),
    }),
  })
  @PermissionWithAction('read_permission')
  async list(ctx: Context) {
    const {
      request: { query },
      userData: { userinfo },
    } = ctx;
    const commonCondition = {
      code_contains: query.codeContains,
      name_contains: query.nameContains,
      isCategory_eq: query.isCategoryEq,
    };
    const where: any = [
      {
        platformId_eq: userinfo.platformId, // 只能查看自己平台的权限，和通用权限
        ...commonCondition,
      },
      {
        isGlobal_eq: 1,
        ...commonCondition,
      },
    ];
    return await this.permService.findAndCount({
      where,
      offset: (query.pageIndex - 1) * query.pageSize,
      limit: query.pageSize,
      orderBy: 'createdAt_DESC',
    });
  }

  /**
   * 查询指定用户的权限列表
   * @param ctx
   */
  @Get()
  @Summary('查询指定用户的权限列表')
  @Parameters({
    query: Joi.object().keys({
      userId: Joi.string().description('用户ID'),
      withParent: Joi.number()
        .integer()
        .valid(1, 0)
        .default(0)
        .description('是否查询上级权限，1查询，0不查询'),
    }),
  })
  @PermissionWithAction('read_permission')
  async userPermissions(ctx: Context) {
    const {
      request: { query },
      userData: { userinfo },
    } = ctx;
    const user = await this.userService.checkUser(query.userId);
    if (!user) {
      return;
    }
    const permissions = await this.permService.getAllPermissionByUser(userinfo.id);
    // 不查询上级权限，直接返回列表结果
    if (query.withParent !== 1) {
      return permissions;
    }
    // 获取上级权限列表
    return await this.permService.relaSupreior(permissions);
  }

  /**
   * 查询指定角色的权限列表
   * @param ctx
   */
  @Get()
  @Summary('查询指定角色的权限列表')
  @Parameters({
    query: Joi.object().keys({
      roleId: Joi.string().description('角色ID'),
      withParent: Joi.number()
        .integer()
        .valid(1, 0)
        .default(0)
        .description('是否查询上级权限，1查询，0不查询'),
    }),
  })
  @PermissionWithAction('read_permission')
  async rolePermissions(ctx: Context) {
    const { roleId, withParent } = ctx.query;
    const role = await this.roleService.checkRole(roleId);
    if (!role) {
      return;
    }
    const permissions = await this.permService.getPermissionsByRole(roleId);
    // 不查询上级菜单，直接返回列表结果
    if (withParent !== 1) {
      return permissions;
    }
    // 获取上级菜单列表
    return await this.permService.relaSupreior(permissions);
  }

  /**
   * 添加权限接口
   * @param ctx
   */
  @Post()
  @Summary('添加权限接口')
  @Parameters({
    body: createPermissionParams,
  })
  @PermissionWithAction('write_permission')
  async create(ctx: Context) {
    const {
      request: { body },
      userData: { userinfo },
    } = ctx;
    // 只能添加自己平台的用户
    body.platformId = userinfo.platformId;
    return await this.permService.create(body);
  }

  /**
   * 修改权限接口
   * @param ctx
   */
  @Put('/update/:permissionId')
  @Summary('修改权限接口')
  @Parameters({
    body: createPermissionParams,
    pathParams: Joi.object().keys({
      permissionId: Joi.string()
        .required()
        .description('权限id'),
    }),
  })
  @PermissionWithAction('write_permission')
  async update(ctx: Context) {
    const {
      request: { body },
      params: { permissionId },
    } = ctx;
    const permission = await this.permService.checkPermission(permissionId);
    if (permission) {
      return await this.permService.updateById(body, permissionId);
    }
  }

  /**
   * 删除权限
   * @param ctx
   */
  @Delete('/delete/:permissionId')
  @Summary('删除权限接口')
  @Parameters({
    pathParams: Joi.object().keys({
      permissionId: Joi.string().description('权限id'),
    }),
  })
  @PermissionWithAction('write_permission')
  async delete(ctx: Context) {
    const {
      params: { permissionId },
    } = ctx;
    const permission = await this.permService.checkPermission(permissionId);
    if (permission) {
      return await this.permService.delete({
        id: permissionId,
      });
    }
  }

  /**
   * 添加用权限
   */
  @Put()
  @Summary('添加用户权限')
  @Parameters({
    body: Joi.object().keys({
      userId: Joi.string()
        .required()
        .description('要添加的用户ID'),
      permissionIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .description('要添加的权限ID列表'),
    }),
  })
  @PermissionWithAction(['write_permission', 'write_user'])
  async addPermissionsWithUser(ctx: Context) {
    const { userId, permissionIds } = ctx.request.body;
    const [user, permIds] = await Promise.all([
      this.userService.checkUser(userId),
      this.permService.filterOwnPermissions(permissionIds),
    ]);
    if (user && permIds) {
      return await this.permService.addUserPermission({
        userId,
        permissionIds: permIds,
      });
    }
  }

  /**
   * 删除用户权限
   * @param ctx
   */
  @Delete()
  @Summary('删除用户权限')
  @Parameters({
    body: Joi.object().keys({
      userId: Joi.string()
        .required()
        .description('要删除的用户ID'),
      permissionIds: Joi.array()
        .items(Joi.string())
        .description('要删除的权限ID列表，不传默认删除所有'),
    }),
  })
  @PermissionWithAction(['write_permission', 'write_user'])
  async deletePermissionsWithUser(ctx: Context) {
    const { userId, permissionIds } = ctx.request.body;
    return await this.permService.delUserPermission({
      userId,
      permissionIds: Array.from(new Set(permissionIds)),
    });
  }

  /**
   * 添加角色权限
   * @param ctx
   */
  @Put()
  @Summary('添加角色权限')
  @Parameters({
    body: Joi.object().keys({
      roleId: Joi.string()
        .required()
        .description('要添加的角色ID'),
      permissionIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .description('要添加的权限ID列表'),
    }),
  })
  @PermissionWithAction(['write_permission', 'write_role'])
  async addPermissionsWithRole(ctx: Context) {
    const { roleId, permissionIds } = ctx.request.body;
    const [role, permIds] = await Promise.all([
      this.roleService.checkRole(roleId),
      this.permService.filterOwnPermissions(permissionIds),
    ]);
    if (role && permIds) {
      return await this.permService.addRolePermission({
        roleId,
        permissionIds: permIds,
      });
    }
  }

  /**
   * 删除角色权限
   */
  @Delete()
  @Summary('删除角色权限')
  @Parameters({
    body: Joi.object().keys({
      roleId: Joi.string()
        .required()
        .description('要删除的角色ID'),
      permissionIds: Joi.array()
        .items(Joi.string())
        .description('要删除的权限ID列表，不传默认删除所有'),
    }),
  })
  @PermissionWithAction(['write_permission', 'write_role'])
  async deletePermissionsWithRole(ctx: Context) {
    const { roleId, permissionIds } = ctx.request.body;
    return await this.permService.delRolePermission({
      roleId,
      permissionIds: Array.from(new Set(permissionIds)),
    });
  }

  /**
   * 全量修改用户权限
   * @param ctx
   */
  @Post()
  @Summary('全量修改用户权限')
  @Description('先删除用户当前所有权限，再添加新权限')
  @Parameters({
    body: Joi.object().keys({
      userId: Joi.string()
        .required()
        .description('要操作的用户ID'),
      permissionIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .description('要添加的权限ID列表'),
    }),
  })
  @PermissionWithAction(['write_user', 'write_permission'])
  async transferPermissionsWithUser(ctx: Context) {
    const { userId, permissionIds } = ctx.request.body;
    const [user, permIds] = await Promise.all([
      this.userService.checkUser(userId),
      this.permService.filterOwnPermissions(permissionIds),
    ]);
    if (user && permIds) {
      return await this.permService.transferUserPermission({
        userId,
        permissionIds: permIds,
      });
    }
  }

  /**
   * 全量修改角色权限
   * @param ctx
   */
  @Post()
  @Summary('全量修改角色权限')
  @Description('先删除角色当前所有权限，再添加新权限')
  @Parameters({
    body: Joi.object().keys({
      roleId: Joi.string()
        .required()
        .description('要操作的角色ID'),
      permissionIds: Joi.array()
        .items(Joi.string())
        .min(1)
        .description('要添加的权限ID列表'),
    }),
  })
  @PermissionWithAction(['write_role', 'write_permission'])
  async transferPermissionsWithRole(ctx: Context) {
    const { roleId, permissionIds } = ctx.request.body;
    const [role, permIds] = await Promise.all([
      this.roleService.checkRole(roleId),
      this.permService.filterOwnPermissions(permissionIds),
    ]);
    if (role && permIds) {
      return await this.permService.transferRolePermission({
        roleId,
        permissionIds: permIds,
      });
    }
  }
}
