// This file is created by egg-ts-helper@1.25.5
// Do not modify this file!!!!!!!!!

import 'egg';
import ExportHome from '../../../app/controller/home';
import ExportApiAuthorize from '../../../app/controller/api/authorize';
import ExportApiEureka from '../../../app/controller/api/eureka';
import ExportK12RegulateApplication from '../../../app/controller/k12/regulate/application';
import ExportK12RegulateModule from '../../../app/controller/k12/regulate/module';
import ExportK12RegulatePower from '../../../app/controller/k12/regulate/power';
import ExportOpenApiAuthorize from '../../../app/controller/open/api/authorize';
import ExportOpenApiMenu from '../../../app/controller/open/api/menu';
import ExportOpenApiOauth from '../../../app/controller/open/api/oauth';
import ExportOpenApiPermission from '../../../app/controller/open/api/permission';
import ExportOpenApiRole from '../../../app/controller/open/api/role';
import ExportOpenApiUser from '../../../app/controller/open/api/user';
import ExportOpenWechatAccount from '../../../app/controller/open/wechat/account';
import ExportOpenWechatAuthorize from '../../../app/controller/open/wechat/authorize';
import ExportOpenWechatMenu from '../../../app/controller/open/wechat/menu';
import ExportOpenWechatServer from '../../../app/controller/open/wechat/server';
import ExportOpenWechatTemplate from '../../../app/controller/open/wechat/template';
import ExportOpenWechatUser from '../../../app/controller/open/wechat/user';

declare module 'egg' {
  interface IController {
    home: ExportHome;
    api: {
      authorize: ExportApiAuthorize;
      eureka: ExportApiEureka;
    }
    k12: {
      regulate: {
        application: ExportK12RegulateApplication;
        module: ExportK12RegulateModule;
        power: ExportK12RegulatePower;
      }
    }
    open: {
      api: {
        authorize: ExportOpenApiAuthorize;
        menu: ExportOpenApiMenu;
        oauth: ExportOpenApiOauth;
        permission: ExportOpenApiPermission;
        role: ExportOpenApiRole;
        user: ExportOpenApiUser;
      }
      wechat: {
        account: ExportOpenWechatAccount;
        authorize: ExportOpenWechatAuthorize;
        menu: ExportOpenWechatMenu;
        server: ExportOpenWechatServer;
        template: ExportOpenWechatTemplate;
        user: ExportOpenWechatUser;
      }
    }
  }
}
