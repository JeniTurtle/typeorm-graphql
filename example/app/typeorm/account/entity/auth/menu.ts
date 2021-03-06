import { BaseModel, Model, StringField, OneToMany, EnumField, ManyToOne, IntField } from 'egg-typeorm-graphql';
import { MenuUser } from './menuUser';
import { MenuRole } from './menuRole';
import { Platform } from './platform';

export enum MenuIsCategory {
  YES = 1,
  NO = 0,
}

@Model({ database: 'accountDB' })
export class Menu extends BaseModel {
  @StringField({ maxLength: 128, comment: '菜单名称' })
  name: string;

  @StringField({ maxLength: 256, comment: '菜单编号' })
  code: string;

  @StringField({ maxLength: 256, comment: '菜单地址' })
  path: string;

  @StringField({ maxLength: 256, comment: '图标地址' })
  icon: string;

  @IntField({ comment: '菜单顺序', nullable: true })
  order?: number;

  @EnumField('MenuIsCategory', MenuIsCategory, {
    default: MenuIsCategory.NO,
    comment: '是否是分类，用来把菜单分组用，用户菜单请不要绑定分类',
  })
  isCategory: MenuIsCategory;

  @StringField({ maxLength: 1024, comment: '备注', nullable: true })
  remark?: string;

  @ManyToOne(
    _type => Menu,
    menu => menu.supreior,
    {
      comment: '上级菜单分类',
      nullable: true,
    },
  )
  supreior: Menu;
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
    _type => MenuUser,
    menuUsers => menuUsers.menu,
  )
  menuUsers!: MenuUser[];

  @OneToMany(
    _type => MenuRole,
    menuRoles => menuRoles.menu,
  )
  menuRoles!: MenuRole[];
}
