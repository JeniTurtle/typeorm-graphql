import { Permission } from './permission';
import { BaseModel, Model, ManyToOne } from 'egg-typeorm-graphql';
import { User } from './user';

@Model({ database: 'accountDB' })
export class PermissionUser extends BaseModel {
  @ManyToOne(
    _type => User,
    user => user.permissionUsers,
    { comment: '用户ID', primary: true },
  )
  user: User;
  userId: string;

  @ManyToOne(
    _type => Permission,
    permission => permission.permissionUsers,
    { comment: '权限ID', primary: true },
  )
  permission: Permission;
  permissionId: string;
}
