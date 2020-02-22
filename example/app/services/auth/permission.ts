import * as assert from 'assert';
import { Service } from 'typedi';
import { Repository, Transaction, TransactionRepository, Brackets } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { Permission, PermissionIsGlobal, PermissionIsCategory } from '@typeorm/account/entity/auth/permission';
import { RoleUser } from '@typeorm/account/entity/auth/roleUser';
import { PermissionRole } from '@typeorm/account/entity/auth/permissionRole';
import { PermissionUser } from '@typeorm/account/entity/auth/permissionUser';

@Service()
export default class PermissionService extends BaseService<Permission> {
  @InjectRepository(RoleUser)
  protected readonly roleUserRepository: Repository<RoleUser>;

  @InjectRepository(PermissionUser)
  protected readonly permUserRepository: Repository<PermissionUser>;

  @InjectRepository(PermissionRole)
  protected readonly permRoleRepository: Repository<PermissionRole>;

  constructor(@InjectRepository(Permission) readonly repository: Repository<Permission>) {
    super(Permission, repository);
  }

  /**
   * 获取该用户所有权限
   * @param userId
   */
  async getAllPermissionByUser(userId: string, isSuperuser: boolean = false) {
    // 如果是超级管理员，无需返回权限列表
    if (isSuperuser) {
      return [];
    }
    const roleUserService = this.getService<RoleUser>(RoleUser, this.roleUserRepository);
    // 获取用户所属角色，和用户下的权限
    const [roles, userPerms] = await Promise.all([
      roleUserService.find({
        where: { userId },
      }),
      this.getPermissionsByUser(userId),
    ]);
    // 获取角色下的所有权限
    const rolePerms = await this.getPermissionsByRole(roles.map(role => role.roleId));

    // 合并权限，并去重
    const allPerms: Permission[] = userPerms.concat(rolePerms);
    const map = new Map<string, boolean>();

    return allPerms.reduce((prev: Permission[], next: Permission) => {
      if (!map.has(next.id)) {
        map.set(next.id, true);
        prev.push(next);
      }
      return prev;
    }, []);
  }

  /**
   * 获取用户的权限
   * @param userId
   */
  async getPermissionsByUser(userId: string) {
    const platformId = this.ctx.platform.id;
    const ret = await this.repository
      .createQueryBuilder('permission')
      .where(
        new Brackets(qb => {
          qb.where('permission.platformId = :platformId', { platformId }).orWhere('permission.isGlobal = :isGlobal', {
            isGlobal: PermissionIsGlobal.YES,
          });
        }),
      )
      .andWhere('permission.deletedAt is null')
      .andWhere('permission.is_category = :isCategory', { isCategory: PermissionIsCategory.NO })
      .innerJoin('permission.permissionUsers', 'permUser')
      .andWhere('permUser.deletedAt is null')
      .innerJoin('permUser.user', 'user', 'user.id = :userId')
      .andWhere('user.deletedAt is null')
      .setParameters({ userId })
      .getMany();
    return ret;
  }

  /**
   * 获取角色的权限
   * @param roleId
   */
  async getPermissionsByRole(roleId: string | string[]) {
    const platformId = this.ctx.platform.id;
    const condition: any = [];
    if (!roleId || roleId.length < 1) {
      return [];
    }
    if (Array.isArray(roleId)) {
      condition.push('role.id in (:...ids)', { ids: roleId });
    } else {
      condition.push('role.id = :id', { id: roleId });
    }
    const ret = await this.repository
      .createQueryBuilder('permission')
      .where(
        new Brackets(qb => {
          qb.where('permission.platformId = :platformId', { platformId }).orWhere('permission.isGlobal = :isGlobal', {
            isGlobal: PermissionIsGlobal.YES,
          });
        }),
      )
      .andWhere('permission.deletedAt is null')
      .andWhere('permission.is_category = :isCategory', { isCategory: PermissionIsCategory.NO })
      .innerJoin('permission.permissionRoles', 'permRole')
      .andWhere('permRole.deletedAt is null')
      .innerJoin('permRole.role', 'role', ...condition)
      .andWhere('role.deletedAt is null')
      .getMany();
    return ret;
  }

  /**
   * 绑定用户权限
   * @param param0
   */
  async addUserPermission(
    { userId, permissionIds }: { userId: string; permissionIds: string[] },
    permUserRepo?: Repository<PermissionUser>,
  ) {
    const permUserService = this.getService<PermissionUser>(PermissionUser, permUserRepo || this.permUserRepository);
    // 从新增的权限中，获取用户已经绑定的权限列表
    const existingData: PermissionUser[] = await permUserService.find({
      where: {
        userId,
        permissionId_in: permissionIds,
      },
    });
    // 如果该用户已经有权限了，那么不再新增
    const data = permissionIds
      .filter(permId => !existingData.find(entity => entity.userId === userId && entity.permissionId === permId))
      .map(id => ({
        userId,
        permissionId: id,
      }));
    // 新增用户没有的权限
    const results = await permUserService.createMany(data);
    return existingData.concat(results);
  }

  /**
   * 添加角色权限
   * @param param0
   */
  async addRolePermission(
    { roleId, permissionIds }: { roleId: string; permissionIds: string[] },
    permRoleRepo?: Repository<PermissionRole>,
  ) {
    const permRoleService = this.getService<PermissionRole>(PermissionRole, permRoleRepo || this.permRoleRepository);
    // 从新增的权限中，获取用户已经绑定的权限列表
    const existingData: PermissionRole[] = await permRoleService.find({
      where: {
        roleId,
        permissionId_in: permissionIds,
      },
    });
    // 如果该用户已经有权限了，那么不再新增
    const data = permissionIds
      .filter(
        permId =>
          !existingData.find(entity => {
            return entity.roleId === roleId && entity.permissionId === permId;
          }),
      )
      .map(id => ({
        roleId,
        permissionId: id,
      }));
    // 新增用户没有的权限
    const results = await permRoleService.createMany(data);
    return existingData.concat(results);
  }

  /**
   * 删除角色权限
   * @param param0
   */
  async delRolePermission(
    { roleId, permissionIds = [] }: { roleId: string; permissionIds?: string[] },
    permRoleRepo?: Repository<PermissionRole>,
  ) {
    const permRoleService = this.getService<PermissionRole>(PermissionRole, permRoleRepo || this.permRoleRepository);
    // 不传权限id，默认删除所有
    const where: any = {
      roleId,
    };
    // 传权限id，只删除传入的
    if (permissionIds.length > 0) {
      where.permissionId_in = permissionIds;
    }
    return await permRoleService.delete(where);
  }

  /**
   * 删除用户权限
   * @param param0
   */
  async delUserPermission(
    { userId, permissionIds = [] }: { userId: string; permissionIds?: string[] },
    permUserRepo?: Repository<PermissionUser>,
  ) {
    const permUserService = this.getService<PermissionUser>(PermissionUser, permUserRepo || this.permUserRepository);
    // 不传权限id，默认删除所有
    const where: any = {
      userId,
    };
    // 传权限id，只删除传入的
    if (permissionIds.length > 0) {
      where.permissionId_in = permissionIds;
    }
    return await permUserService.delete(where);
  }

  /**
   * 先删除用户所有权限，再添加新权限
   * @param param0
   * @param permUserRepo
   */
  @Transaction('accountDB')
  async transferUserPermission(
    { userId, permissionIds = [] }: { userId: string; permissionIds?: string[] },
    @TransactionRepository(PermissionUser) permUserRepo?: Repository<PermissionUser>,
  ) {
    // 删除用户所有权限
    await this.delUserPermission({ userId }, permUserRepo);
    // 添加新权限
    return await this.addUserPermission({ userId, permissionIds }, permUserRepo);
  }

  /**
   * 先删除角色所有权限，再添加新权限
   * @param param0
   * @param permRoleRepo
   */
  @Transaction('accountDB')
  async transferRolePermission(
    { roleId, permissionIds = [] }: { roleId: string; permissionIds?: string[] },
    @TransactionRepository(PermissionRole) permRoleRepo?: Repository<PermissionRole>,
  ) {
    // 删除角色所有权限
    await this.delRolePermission({ roleId }, permRoleRepo);
    // 添加新权限
    return await this.addRolePermission({ roleId, permissionIds }, permRoleRepo);
  }

  /**
   * 权限过滤方法，只能查看自己平台的权限和通用权限
   * @param permissionIds
   */
  async filterOwnPermissions(permissionIds: string[]) {
    const { userinfo } = this.ctx.userData;
    const where: any = [
      {
        platformId_eq: userinfo.platformId,
        id_in: permissionIds,
      },
      {
        isGlobal_eq: 1,
        id_in: permissionIds,
      },
    ];
    const permissions = await this.find({
      where,
      fields: ['id'],
    });
    assert(permissions.length > 0, '传入的权限有误');
    return permissions.map(item => item.id);
  }

  /**
   * 效验权限是否属于自己平台
   * @param ctx
   * @param permissionId
   */
  async checkPermission(permissionId: string) {
    const {
      PRIVILEGES_NOT_EXIST_ERROR,
      NO_ALLOW_TO_UPDATE_OTHER_PLATFORM_PERMISSION_ERROR,
    } = this.ctx.app.exception.permission;
    const { userinfo } = this.ctx.userData;
    const permission = await this.findOne({
      id: permissionId,
    });
    // 如果不存在，返回错误信息
    if (!permission) {
      this.ctx.error(PRIVILEGES_NOT_EXIST_ERROR);
    }
    // 判断修改权限是否属于自己平台
    if (userinfo.isSuperuser !== 1 && permission.platformId !== userinfo.platformId) {
      this.ctx.error(NO_ALLOW_TO_UPDATE_OTHER_PLATFORM_PERMISSION_ERROR);
    }
    return permission;
  }

  /**
   * 获取上级权限信息
   */
  async relaSupreior(permissions: Permission[]) {
    // 获取上级权限列表
    const parents = await this.find({
      where: {
        id_in: permissions.map(perm => perm.supreiorId),
      },
    });
    // 关联上级权限
    permissions.forEach(perm => {
      for (const parent of parents) {
        if (parent.id === perm.supreiorId) {
          perm.supreior = parent;
          break;
        }
      }
    });
    return permissions;
  }
}
