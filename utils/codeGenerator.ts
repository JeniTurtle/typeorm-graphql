import * as is from 'is-type-of';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import { writeFile } from 'fs';
import { Application } from 'egg';
import { GraphQLID, GraphQLSchema, printSchema } from 'graphql';
import { buildSchema } from 'type-graphql';
import { Connection } from 'typeorm';
const promisify = require('util').promisify;

import { generateBindingFile } from '../tgql/binding';
import { SchemaGenerator } from './schemaGenerator';

import * as Debug from 'debug';

const debug = Debug('code-generators');

const writeFilePromise = promisify(writeFile);

interface CodeGeneratorOptions {
  resolversPath: string[];
  importPath: string;
}

export class CodeGenerator {
  private options: CodeGeneratorOptions;
  private config: {
    graphql: any;
    ormConfigs: any;
  };
  schema?: GraphQLSchema;

  constructor(private connections: Connection[], private app: Application, { ormConfigs, graphql }) {
    // const generatePath = path.join(app.baseDir, graphql.generatedFolder);
    if (!connections) {
      throw new Error('FileGenerator: connection is required');
    }
    this.config = {
      graphql,
      ormConfigs,
    };
    this.options = {
      // importPath: path.relative(generatePath, path.resolve(__dirname, '../')),
      importPath: 'egg-typeorm-graphql',
      resolversPath: graphql.resolversPath.map(item => {
        if (app.config.env !== 'local') {
          return path.join(app.baseDir, item.replace(/\.ts$/, '.js'));
        }
        return path.join(app.baseDir, item);
      }),
    };
    this.createGeneratedFolder();
  }

  createGeneratedFolder() {
    return mkdirp.sync(this.config.graphql.generatedFolder);
  }

  async generate() {
    debug('generate:start');
    await this.writeGeneratedIndexFile();
    await this.writeGeneratedTSTypes();
    await this.writeOrmConfig();
    await this.writeSchemaFile();
    await this.generateBinding();
    debug('generate:end');
  }

  private async generateBinding() {
    const { generatedFolder } = this.config.graphql;
    debug('generateBinding:start');
    const schemaFilePath = path.join(generatedFolder, 'schema.graphql');
    const outputBindingPath = path.join(generatedFolder, 'binding.ts');
    const x = generateBindingFile(schemaFilePath, outputBindingPath);
    debug('generateBinding:end');
    return x;
  }

  private async buildGraphQLSchema(): Promise<GraphQLSchema> {
    if (!this.schema) {
      debug('code-generator:buildGraphQLSchema:start');
      debug(this.options.resolversPath);
      this.schema = await buildSchema({
        authChecker: this.config.graphql.schema.authChecker,
        scalarsMap: [
          {
            type: 'ID' as any,
            scalar: GraphQLID,
          },
        ],
        resolvers: this.options.resolversPath,
      });
      debug('code-generator:buildGraphQLSchema:end');
    }
    return this.schema;
  }

  private async writeGeneratedTSTypes() {
    debug('writeGeneratedTSTypes:start');
    const generatedTSTypes = await this.getGeneratedTypes();
    const x = this.writeToGeneratedFolder('classes.ts', generatedTSTypes);
    debug('writeGeneratedTSTypes:end');
    return x;
  }

  private async getGeneratedTypes() {
    debug('getGeneratedTypes:start');
    const x = SchemaGenerator.generate(this.app, this.connections, this.config.graphql, this.options.importPath);
    debug('getGeneratedTypes:end');
    return x;
  }

  private async writeSchemaFile() {
    debug('writeSchemaFile:start');
    await this.buildGraphQLSchema();
    const x = this.writeToGeneratedFolder('schema.graphql', printSchema(this.schema as GraphQLSchema));

    debug('writeSchemaFile:end');
    return x;
  }

  private async writeGeneratedIndexFile() {
    return this.writeToGeneratedFolder('index.ts', "export * from './classes';");
  }

  private async writeOrmConfig() {
    const { ormConfigs } = this.config;
    for (const item of ormConfigs) {
      const config = { ...item };
      ['entities'].forEach(key => {
        if (config[key]) {
          const newValue = config[key].map((item: string) => item.replace(/\.ts$/, '.js'));
          config[key] = newValue;
        }
      });
      const namingStrategyName = config.namingStrategy.constructor.name;
      const { generatedOrmConfigDir } = config.cli;
      mkdirp.sync(this.config.graphql.generatedFolder);
      config.logger = is.object(config.logger) || !config.logger ? 'advanced-console' : config.logger;
      const contents = `import {${namingStrategyName}} from '${this.options.importPath}';
      const config = ${JSON.stringify(config)};
      config.namingStrategy = new ${namingStrategyName}();
      module.exports = config;`;
      writeFilePromise(path.join(generatedOrmConfigDir, 'ormconfig.ts'), contents, {
        encoding: 'utf8',
        flag: 'w',
      });
    }
  }

  private async writeToGeneratedFolder(filename: string, contents: string) {
    debug('writeToGeneratedFolder:' + filename + ':start');
    const x = writeFilePromise(path.join(this.config.graphql.generatedFolder, filename), contents, {
      encoding: 'utf8',
      flag: 'w',
    });
    debug('writeToGeneratedFolder:' + filename + ':end');
    return x;
  }
}
