import { Menu } from './menu';
import { BaseModel, Model, ManyToOne } from 'egg-typeorm-graphql';
import { User } from './user';

@Model({ database: 'accountDB' })
export class MenuUser extends BaseModel {
  @ManyToOne(
    _type => User,
    user => user.menuUsers,
    { comment: '用户ID', primary: true },
  )
  user: User;
  userId: string;

  @ManyToOne(
    _type => Menu,
    menu => menu.menuUsers,
    { comment: '菜单ID', primary: true },
  )
  menu: Menu;
  menuId: string;
}
