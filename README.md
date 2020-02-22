# egg-typeorm-graphql

该项目是基于eggjs插件系统开发（稍微进行改造即可抽离），是一个集成TypeORM和Type GraphQL的框架，用于快速构建一致的GraphQL API。支持多数据库，目前主要针对PostgreSQL数据库使用。

### 特点

> 通过自定义的装饰器，将TypeORM Entity和GraphQL type进行合并，避免了重复声明。

> 项目启动时会自动生成GraphQL API，并支持排序、过滤、分页、dataloader等功能，极大的减少了代码的书写量。

> 对TypeORM做了基础功能的封装，以及使用上的优化，对开发者更加友好。

> 基于Typescript开发，使用了大量装饰器来编写简洁的声明性代码。

### 使用说明

#### 安装步骤：
```
npm install egg-typeorm-graphql 
yarn add egg-typeorm-graphql
```

#### 配置方式：

第一步：修改eggjs项目中config/plugin.ts文件，开启egg-typeorm-graphql插件。

```typescript
// 示例代码
import { EggPlugin } from 'egg';

const plugin: EggPlugin = {
  typeorm_graphql: {
    enable: true,
    package: 'egg-typeorm-graphql',
  },
};
export default plugin;
```

第二步：在config/config.default.ts文件中的添加配置。
```typescript
// 示例代码
import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { SnakeNamingStrategy } from 'egg-typeorm-graphql';
import OrmLogger from '@lib/typeormLogger';
import jwtValidate from '@middleware/graphqlMiddleware/jwtValidate';

export default (appInfo: EggAppInfo) => {
  const config = {} as PowerPartial<EggAppConfig>;
  
  // TypeORM设置
  config.typeorm = {
    clients: {
      database1: {  // 这里自定义，等同于在下面配置name: 'database1'
        type: 'postgres',
        host: '数据库IP地址',
        port: '数据库端口',
        username: '用户名',
        password: '密码',
        database: '数据库名称',
        migrationsRun: 'false',
        synchronize: false,
        logging: 'all',
        loggerClass: OrmLogger, // 自定义日志类
        maxQueryExecutionTime: 1500, // 慢查询记录
        entityPrefix: 'mp_',  // 数据库前缀
        namingStrategy: new SnakeNamingStrategy(),  // 数据库命名风格，该风格为驼峰
        entities: ['app/typeorm/database1/entity/**/*.ts'],
        migrations: ['app/typeorm/database1/migration/**/*.ts'],
        subscribers: ['app/typeorm/database1/subscriber/**/*.ts'],
        cli: {
          generatedOrmConfigDir: 'app/typeorm/database1/',  // 注意：项目启动时会生成ormconfig.ts文件，会放到该目录下。生成的ormconfig.ts，主要是用来执行typeorm migrate相关命令。
          entitiesDir: 'app/typeorm/database1/entity',
          migrationsDir: 'app/typeorm/database1/migration',
          subscribersDir: 'app/typeorm/database1/subscriber',
        },
      },
  };

  // GraphQL配置
  config.graphql = {
    graphiql: true,
    middlewares: [jwtValidate],  // graphql中间件
    schema: {
      emitSchemaFile: false,
    },
    generatedFolder: 'app/graphql/generated',  // 注意！项目启动时会自动生成GraphQL API需要的类型和schema代码。
    resolversPath: ['app/graphql/**/*.resolver.ts'], // 开发时存放resolver代码的目录
    maxComplexity: 200, // 最大复杂度，按字段数量来，防止恶意复杂查询，用于造成DDOS攻击
    apolloServer: {
      tracing: true,
      introspection: true,
      playground: {
        settings: {
          'request.credentials': 'include',
        },
      } as any,
    },
  };
  return config;
}
```

#### Entity示例：

app/typeorm/database1/entity/user.ts

```typescript
import { Column } from 'typeorm';
import { Department } from './department';
import { PermissionUser } from './permissionUser';
import { Platform } from './platform';
import { RoleUser } from './roleUser';
import { Organization } from './organization';

import {
  BaseModel,
  DateField,
  EmailField,
  EnumField,
  Model,
  StringField,
  ManyToOne,
  OneToMany,
} from 'egg-typeorm-graphql';

export enum UserIsSuperuser {
  NO = 0,
  YES = 1,
}

export enum UserIsActive {
  NO = 0,
  YES = 1,
}

export enum UserIsStaff {
  NO = 0,
  YES = 1,
}

export enum UserGender {
  UNKNOWN = 0,
  MAN = 1,
  WOMAN = 2,
}

@Model({ database: 'database1' })
export class User extends BaseModel {
  @StringField({ maxLength: 128, comment: '用户名' })
  @Column({ length: 128, comment: '用户名' })
  username: string;

  @Column({ comment: '密码', length: 128 })
  password: string;

  @StringField({ maxLength: 128, comment: '真实姓名', nullable: true })
  realname?: string;

  @StringField({ maxLength: 128, nullable: true, comment: '用户昵称' })
  nickname?: string;

  @EnumField('UserGender', UserGender, { default: UserGender.UNKNOWN, comment: '性别' })
  gender: UserGender;

  @EnumField('UserIsSuperuser', UserIsSuperuser, { default: UserIsSuperuser.NO, comment: '是否是超级管理员' })
  isSuperuser: UserIsSuperuser;

  @EnumField('UserIsStaff', UserIsStaff, { default: UserIsStaff.NO, comment: '是否是员工' })
  isStaff: UserIsStaff;

  @EnumField('UserIsActive', UserIsActive, { default: UserIsActive.YES, comment: '是否启用' })
  isActive: UserIsActive;

  @EmailField({ nullable: true, comment: '电子邮箱' })
  email?: string;

  @StringField({ maxLength: 32, comment: '手机号码', nullable: true })
  mobile?: string;

  @DateField({ comment: '首次登陆时间', nullable: true })
  firstLoginTime?: Date;

  @DateField({ comment: '最后一次登陆时间', nullable: true })
  lastLoginTime?: Date;

  @ManyToOne(
    _type => Department,
    department => department.user,
    {
      nullable: true,
      comment: '所属部门',
    },
  )
  department?: Department;
  departmentId?: string;

  @ManyToOne(
    _type => Organization,
    organization => organization.user,
    {
      nullable: true,
      comment: '所属机构',
    },
  )
  organization?: Organization;
  organizationId?: string;

  @ManyToOne(
    _type => Platform,
    platform => platform.user,
    {
      nullable: true,
      comment: '所属平台',
    },
  )
  platform?: Platform;
  platformId?: string;

  @OneToMany(
    _type => PermissionUser,
    permissionUsers => permissionUsers.user,
  )
  permissionUsers: PermissionUser[];

  @OneToMany(
    _type => RoleUser,
    roleUsers => roleUsers.user,
  )
  roleUsers: RoleUser[];
```

#### Service示例：

app/service/role.ts

```typescript
import * as assert from 'assert';
import { Service } from 'typedi';
import { Repository, DeepPartial, Transaction, TransactionRepository } from 'typeorm';
import { BaseService, InjectRepository } from 'egg-typeorm-graphql';
import { Role } from '@typeorm/database1/entity/auth/role';
import { RoleUser } from '@typeorm/database1/entity/auth/roleUser';

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
  @Transaction('database1')
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
```

#### Resolver示例：
app/graphql/resolver/role.ts

```typescript
import { Resolver, Mutation, Arg, Ctx, FieldResolver, Root, InputType, Field } from 'type-graphql';
import { Inject } from 'typedi';
import { Context } from 'egg';
import { BindServiceCtx } from 'egg-typeorm-graphql';
import { User } from '@typeorm/account/entity/auth/user';
import { Role } from '@typeorm/account/entity/auth/role';
import { RoleUser } from '@typeorm/account/entity/auth/roleUser';
import RoleService from '@service/auth/role';
import { PermissionWithAction } from '@decorator/permission';

@InputType()
export class BindUserRoleInput {
  @Field()
  userId!: string;

  @Field(_type => [String])
  roleIds!: string[];
}

@Resolver(RoleUser)
export class RoleUserResolver {
  @Inject()
  protected readonly roleService: RoleService;

  @FieldResolver(() => User, {
    complexity: 20, // 20个字段长度的复杂度
  })
  @PermissionWithAction('read_user')
  async user(@Root() roleUser: RoleUser, @Ctx() ctx: Context): Promise<User> {
    return ctx.dataLoader.loaders.RoleUser.user.load(roleUser);
  }

  @FieldResolver(() => Role)
  @PermissionWithAction('read_role')
  async role(@Root() roleUser: RoleUser, @Ctx() ctx: Context): Promise<Role> {
    return ctx.dataLoader.loaders.RoleUser.role.load(roleUser);
  }

  @BindServiceCtx
  @Mutation(() => [RoleUser])
  @PermissionWithAction(['write_role', 'write_user'])
  async addUserRole(@Ctx() _ctx: Context, @Arg('data') data: BindUserRoleInput): Promise<RoleUser[]> {
    const { userId, roleIds } = data;
    return await this.roleService.addUserRole({ userId, roleIds });
  }
}
```
#### 友情提示：

本人太懒，不擅长写文档，只能提供代码示例供感兴趣的大佬们阅读一下，如有问题可以联系本人:1002563923@qq.com




