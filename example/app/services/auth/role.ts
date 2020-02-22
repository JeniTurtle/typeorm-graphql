import * as assert from 'assert';
import { Service } from 'typedi';
import { Repository, DeepPartial, Transaction, TransactionRepository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { Role } from '@typeorm/account/entity/auth/role';
import { RoleUser } from '@typeorm/account/entity/auth/roleUser';

@Service()
export default class RoleService extends BaseService<Role> {
  @InjectRepository(RoleUser)
  protected readonly roleUserRepository: Repository<RoleUser>;

  constructor(@InjectRepository(Role) readonly repository: Repository<Role>) {
    super(Role, repository);
  }

  /**
   * 判断角色编号是否存在，
   * 不同平台，角色编号可以一样
   * @param newRole
   * @param oldRole
   */
  async checkRepeatedRoleCode(newRole: DeepPartial<Role>, oldRole?: Role) {
    const { platformId } = this.ctx.userData.userinfo;
    const { ROLECODE_ALREADY_EXISTS_ERROR } = this.ctx.app.exception.role;
    if (!oldRole || (newRole.roleCode && oldRole.roleCode !== newRole.roleCode)) {
      const roleNum = await this.count({
        platformId,
        roleCode: newRole.roleCode,
        deletedAt: null,
      });
      if (roleNum > 0) {
        this.ctx.error(ROLECODE_ALREADY_EXISTS_ERROR);
      }
    }
    return true;
  }

  /**
   * 获取多个用户对应的角色关系
   */
  async getRolesMappingByUsers(userIds: string[]) {
    return await this.roleUserRepository
      .createQueryBuilder('roleUsers')
      .where('roleUsers.deletedAt is null')
      .andWhere('roleUsers.userId in (:...userIds)')
      .leftJoinAndSelect('roleUsers.role', 'role')
      .andWhere('role.deletedAt is null')
      .setParameters({ userIds })
      .getMany();
  }

  /**
   * 获取单个用户拥有的角色列表
   * @param userId
   */
  async getRolesByUser(userId: string) {
    const platformId = this.ctx.platform.id;
    return await this.repository
      .createQueryBuilder('role')
      .where('role.platformId = :platformId')
      .andWhere('role.deletedAt is null')
      .innerJoin('role.roleUsers', 'roleUser')
      .andWhere('roleUser.deletedAt is null')
      .innerJoin('roleUser.user', 'user', 'user.id = :userId')
      .setParameters({ platformId, userId })
      .getMany();
  }

  /**
   * 创建角色
   * @param data
   */
  async createRole(data: DeepPartial<Role>) {
    const checkRepeatedRet = await this.checkRepeatedRoleCode(data);
    if (!checkRepeatedRet) {
      return;
    }
    return this.create(data);
  }

  /**
   * 添加用户角色
   * @param param0
   */
  async addUserRole({ userId, roleIds }: { userId: string; roleIds: string[] }, roleUserRepo?: Repository<RoleUser>) {
    const roleUserService = this.getService<RoleUser>(RoleUser, roleUserRepo || this.roleUserRepository);
    // 从新增的角色，获取用户已经绑定的角色列表
    const existingData: RoleUser[] = await roleUserService.find({
      where: {
        userId,
        roleId_in: roleIds,
      },
    });
    // 如果该用户已经有角色了，那么不再新增
    const data = roleIds
      .filter(
        roleId =>
          !existingData.find(entity => {
            return entity.userId === userId && entity.roleId === roleId;
          }),
      )
      .map(roleId => ({
        roleId,
        userId,
      }));
    // 新增用户没有的角色
    const saveInfo = await roleUserService.createMany(data);
    return existingData.concat(saveInfo);
  }

  /**
   * 删除用户角色
   * @param param0
   */
  async delUserRole(
    { userId, roleIds = [] }: { userId: string; roleIds?: string[] },
    roleUserRepo?: Repository<RoleUser>,
  ) {
    const roleUserService = this.getService<RoleUser>(RoleUser, roleUserRepo || this.roleUserRepository);
    // 不传角色id，默认删除所有
    const where: any = {
      userId,
    };
    // 传角色id，只删除传入的
    if (roleIds.length > 0) {
      where.roleId_in = roleIds;
    }
    return await roleUserService.delete(where);
  }

  /**
   * 先删除用户所有角色，再添加新角色
   * @param param0
   * @param roleUserRepo
   */
  @Transaction('accountDB')
  async transferUserRole(
    { userId, roleIds = [] }: { userId: string; roleIds?: string[] },
    @TransactionRepository(RoleUser) roleUserRepo?: Repository<RoleUser>,
  ) {
    // 删除用户所有有角色
    await this.delUserRole({ userId }, roleUserRepo);
    // 添加新角色
    return await this.addUserRole({ userId, roleIds }, roleUserRepo);
  }

  /**
   * 效验角色是否属于自己平台
   * @param ctx
   * @param roleId
   */
  async checkRole(roleId: string) {
    const { ROLE_NOT_EXIST_ERROR, NO_ALLOW_TO_UPDATE_OTHER_PLATFORM_ROLE_ERROR } = this.ctx.app.exception.role;
    const { userinfo } = this.ctx.userData;
    const role = await this.findOne({
      id: roleId,
    });
    // 如果不存在，返回错误信息
    if (!role) {
      this.ctx.error(ROLE_NOT_EXIST_ERROR);
    }
    // 判断修改角色是否属于自己平台
    if (userinfo.isSuperuser !== 1 && role.platformId !== userinfo.platformId) {
      this.ctx.error(NO_ALLOW_TO_UPDATE_OTHER_PLATFORM_ROLE_ERROR);
    }
    return role;
  }

  /**
   * 角色过滤方法，只能查看自己平台角色
   * @param roleIds
   */
  async filterOwnRoles(roleIds: string[]) {
    const { userinfo } = this.ctx.userData;
    const where: any = {
      platformId_eq: userinfo.platformId,
      id_in: roleIds,
    };
    const roles = await this.find({
      where,
      fields: ['id'],
    });
    assert(roles.length > 0, '传入的角色有误');
    return roles.map(item => item.id);
  }
}
