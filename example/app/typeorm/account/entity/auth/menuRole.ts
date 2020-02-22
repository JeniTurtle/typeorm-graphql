import { Menu } from './menu';
import { BaseModel, Model, ManyToOne } from 'egg-typeorm-graphql';
import { Role } from './role';

@Model({ database: 'accountDB' })
export class MenuRole extends BaseModel {
  @ManyToOne(
    _type => Role,
    role => role.menuRoles,
    { comment: '角色ID', primary: true },
  )
  role: Role;
  roleId: string;

  @ManyToOne(
    _type => Menu,
    menu => menu.menuRoles,
    { comment: '菜单ID', primary: true },
  )
  menu: Menu;
  menuId: string;
}
