import { AuthChecker } from 'type-graphql';

import { BaseContext } from './context';

export const authChecker: AuthChecker<BaseContext> = ({ context: { user } }, permissions) => {
  if (!user) {
    return false;
  }

  if (user.permissions.length === 0) {
    return user !== undefined;
  }
  return permissions.some((perm: string) => user.permissions.includes(perm));
};
