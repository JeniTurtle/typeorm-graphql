import { BaseModel, Model, ManyToOne, EnumField } from 'egg-typeorm-graphql';
import { User } from './user';
import { Role } from './role';

export enum RoleUserIsActive {
  NO = 0,
  YES = 1,
}

@Model({ database: 'accountDB' })
export class RoleUser extends BaseModel {
  @ManyToOne(
    _type => User,
    user => user.roleUsers,
    { comment: '用户ID', primary: true },
  )
  user: User;
  userId: string;

  @ManyToOne(
    _type => Role,
    role => role.roleUsers,
    { comment: '角色ID', primary: true },
  )
  role: Role;
  roleId: string;
}
