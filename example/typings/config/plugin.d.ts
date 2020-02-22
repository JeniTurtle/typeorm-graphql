// This file is created by egg-ts-helper@1.25.5
// Do not modify this file!!!!!!!!!

import 'egg';
import 'egg-onerror';
import 'egg-session';
import 'egg-i18n';
import 'egg-watcher';
import 'egg-multipart';
import 'egg-security';
import 'egg-development';
import 'egg-logrotator';
import 'egg-schedule';
import 'egg-static';
import 'egg-jsonp';
import 'egg-view';
import 'egg-cors';
import 'egg-redis';
import 'egg-view-nunjucks';
import 'egg-rabbitmq-plus';
import 'egg-eureka-plus';
import 'egg-typeorm-graphql';
import { EggPluginItem } from 'egg';
declare module 'egg' {
  interface EggPlugin {
    onerror?: EggPluginItem;
    session?: EggPluginItem;
    i18n?: EggPluginItem;
    watcher?: EggPluginItem;
    multipart?: EggPluginItem;
    security?: EggPluginItem;
    development?: EggPluginItem;
    logrotator?: EggPluginItem;
    schedule?: EggPluginItem;
    static?: EggPluginItem;
    jsonp?: EggPluginItem;
    view?: EggPluginItem;
    cors?: EggPluginItem;
    redis?: EggPluginItem;
    nunjucks?: EggPluginItem;
    rabbitmq?: EggPluginItem;
    eureka?: EggPluginItem;
    typeorm_graphql?: EggPluginItem;
  }
}