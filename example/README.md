### 项目介绍

此项目基于eggjs、typedi、typeorm、type-graphQL深度定制，主要依赖于egg-shell-plus项目，致力于打造一套高效、稳定、可快速开发的企业级应用框架。

不过！该项目的文档是没有的，只能意会，不可言传。如果不能够了解上述相关依赖的正确使用方式，对使用会有一定阻碍，可能会由于不正确的使用方式，而导致异常错误。

### 项目说明

管理自身系统的接口使用graphql，开放给接入平台的接口使用的restful，详情参考swagger文档。

另外带有eureka服务注册插件，可以获取远程配置文件，以及rebbitmq插件。

注：该项目使用场景基于eureka服务，如果不使用eureka，先修改config/plugin.ts，把eureka插件关闭。

再修改app.ts和agent.ts，把configHandler.ts相关的方法注释掉，最后改下数据库、redis相关的配置项即可。

### Development

```bash
$ npm i
$ npm run dev
$ open http://localhost:7021/graphql
$ open http://127.0.0.1:7021/swagger-ui/index.html
```

Don't tsc compile at development mode, if you had run `tsc` then you need to `npm run clean` before `npm run dev`.

### Deploy

```bash
$ npm run tsc
$ npm start
```

### Npm Scripts
- 使用 `account_db:generate` 生成数据库变更记录

- 使用 `account_db:migrate` 把变更记录同步到数据库


### Requirement

- Node.js 8.x
- Typescript 2.8+


## swagger文档
-- 启动server后, 打开网址: http://127.0.0.1:7021/swagger-ui/index.html