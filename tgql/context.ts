import { Context } from 'egg';
import { Connection } from 'typeorm';

export interface BaseContext extends Context {
  connection: Connection;
  dataLoader: {
    initialized: boolean;
    loaders: { [key: string]: { [key: string]: any } };
  };
  user?: any;
}
