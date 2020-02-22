import { BaseModel, Model, StringField, OneToMany, EnumField, ManyToOne } from 'egg-typeorm-graphql';
import { PermissionUser } from './permissionUser';
import { PermissionRole } from './permissionRole';
import { Platform } from './platform';

export enum PermissionIsCategory {
  YES = 1,
  NO = 0,
}

export enum PermissionIsGlobal {
  YES = 1,
  NO = 0,
}

@Model({ database: 'accountDB' })
export class Permission extends BaseModel {
  @StringField({ maxLength: 128, comment: '权限名称' })
  name: string;

  @StringField({ maxLength: 256, comment: '权限编号' })
  code: string;

  @EnumField('PermissionIsCategory', PermissionIsCategory, {
    default: PermissionIsCategory.NO,
    comment: '是否是分类，用来跟权限分组用，用户权限请不要绑定分类',
  })
  isCategory: PermissionIsCategory;

  @EnumField('PermissionIsGlobal', PermissionIsGlobal, {
    default: PermissionIsGlobal.NO,
    comment: '是否所有平台通用',
  })
  isGlobal: PermissionIsGlobal;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @ManyToOne(
    _type => Permission,
    permission => permission.supreior,
    {
      comment: '上级权限分类',
      nullable: true,
    },
  )
  supreior: Permission;
  supreiorId: string;

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
    permissionUsers => permissionUsers.permission,
  )
  permissionUsers!: PermissionUser[];

  @OneToMany(
    _type => PermissionRole,
    permissionRoles => permissionRoles.permission,
  )
  permissionRoles!: PermissionRole[];
}
