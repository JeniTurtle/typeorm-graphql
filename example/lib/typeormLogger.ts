import { Application } from 'egg';
import { Logger, QueryRunner } from 'typeorm';

export default class CustomLogger implements Logger {
  constructor(private app: Application, private options?: any) {}

  /**
   * Logs query and parameters used in it.
   */
  logQuery(query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    if (
      this.options === 'all' ||
      this.options === true ||
      (this.options instanceof Array && this.options.indexOf('query') !== -1)
    ) {
      const sql =
        query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '');
      this.app.logger.info('[egg-typeorm] %s %s', '[QUERY]:', sql);
    }
  }

  /**
   * Logs query that is failed.
   */
  logQueryError(error: string, query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    if (
      this.options === 'all' ||
      this.options === true ||
      (this.options instanceof Array && this.options.indexOf('error') !== -1)
    ) {
      const sql =
        query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '');
      this.app.logger.error('[egg-typeorm] %s %s', '[QUERY FAILED]:', sql);
      this.app.logger.error('[egg-typeorm] %s %s', '[ERROR INFO]', error);
    }
  }

  /**
   * Logs query that is slow.
   */
  logQuerySlow(time: number, query: string, parameters?: any[], _queryRunner?: QueryRunner) {
    const sql = query + (parameters && parameters.length ? ' -- PARAMETERS: ' + this.stringifyParams(parameters) : '');
    this.app.logger.warn('[egg-typeorm] %s %s', '[QUERY IS SLOW]:', sql);
    this.app.logger.warn('[egg-typeorm] %s %s', '[EXECUTION TIME]:', time);
  }

  /**
   * Logs events from the schema build process.
   */
  logSchemaBuild(message: string, _queryRunner?: QueryRunner) {
    if (this.options === 'all' || (this.options instanceof Array && this.options.indexOf('schema') !== -1)) {
      this.app.logger.info('[egg-typeorm] %s %s', '[SCHEMA BUILD]:', message);
    }
  }

  /**
   * Logs events from the migration run process.
   */
  logMigration(message: string, _queryRunner?: QueryRunner) {
    this.app.logger.info('[egg-typeorm] %s %s', '[MIGRATION INFO]:', message);
  }

  /**
   * Perform logging using given logger, or by default to the console.
   * Log has its own level and message.
   */
  log(level: 'log' | 'info' | 'warn', message: any, _queryRunner?: QueryRunner) {
    switch (level) {
      case 'log':
        if (this.options === 'all' || (this.options instanceof Array && this.options.indexOf('log') !== -1)) {
          this.app.logger.info('[egg-typeorm] %s %s', '[LOG]:', message);
        }
        break;
      case 'info':
        if (this.options === 'all' || (this.options instanceof Array && this.options.indexOf('info') !== -1)) {
          this.app.logger.info('[egg-typeorm] %s %s', '[INFO]:', message);
        }
        break;
      case 'warn':
        if (this.options === 'all' || (this.options instanceof Array && this.options.indexOf('warn') !== -1)) {
          this.app.logger.warn('[egg-typeorm] %s %s', '[warn]:', message);
        }
        break;
      default:
    }
  }

  /**
   * Converts parameters to a string.
   * Sometimes parameters can have circular objects and therefor we are handle this case too.
   */
  protected stringifyParams(parameters: any[]) {
    try {
      return JSON.stringify(parameters);
    } catch (error) {
      // most probably circular objects in parameters
      return parameters;
    }
  }
}
