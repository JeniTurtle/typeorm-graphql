import * as tte from 'typeorm-typedi-extensions';
import { getMetadataArgsStorage } from 'typeorm';

export const InjectRepository = (entityType: any, connectionName?: string): any => {
  const metadata = getMetadataArgsStorage().tables.find(item => item.target === entityType);
  if (!connectionName) {
    connectionName = metadata?.database || 'default';
  }
  return tte.InjectRepository(entityType, connectionName);
};
