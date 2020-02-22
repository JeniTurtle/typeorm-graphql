import { Index } from 'typeorm';
import { BaseModel, Model, ManyToOne, DateField, IntField } from 'egg-typeorm-graphql';
import { K12ModuleGroup } from './moduleGroup';

@Model({ database: 'k12DB' })
export class K12UserModuleGroupMapping extends BaseModel {
  @DateField({ comment: '过期时间，null为永不过期', nullable: true })
  expireTime?: Date;

  @Index()
  @IntField({ comment: '用户ID' })
  userId: number;

  @ManyToOne(
    _type => K12ModuleGroup,
    moduleGroup => moduleGroup.userModuleGroupMappings,
    { comment: '模块组ID' },
  )
  moduleGroup: K12ModuleGroup;
  moduleGroupId: string;
}
