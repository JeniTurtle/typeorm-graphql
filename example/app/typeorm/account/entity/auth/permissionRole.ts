import { Permission } from './permission';
import { BaseModel, Model, ManyToOne } from 'egg-typeorm-graphql';
import { Role } from './role';

@Model({ database: 'accountDB' })
export class PermissionRole extends BaseModel {
  @ManyToOne(
    _type => Role,
    role => role.permissionRoles,
    { comment: '角色ID', primary: true },
  )
  role: Role;
  roleId: string;

  @ManyToOne(
    _type => Permission,
    permission => permission.permissionRoles,
    { comment: '权限ID', primary: true },
  )
  permission: Permission;
  permissionId: string;
}
