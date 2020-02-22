import { Application } from 'egg';

export default (_app: Application) => {
  return {
    TARGET_NOT_FOUNT_ERROR: {
      code: 1001,
      msg: '操作目标不存在',
    },
    TARGET_IS_NOT_MODULE_ERROR: {
      code: 1002,
      msg: '操作目标不是模块',
    },
    TARGET_IS_NOT_CATEGORY_ERROR: {
      code: 1003,
      msg: '操作目标不是分类',
    },
    TARGET_IS_NOT_NAV_ERROR: {
      code: 1004,
      msg: '操作目标不是导航',
    },
    MODULE_NOT_ALLOW_DELETE_ERROR: {
      code: 1005,
      msg: '该模块下有子模块或权限导航，或有绑定学校，无法删除',
    },
    CATEGORY_NOT_ALLOW_DELETE_ERROR: {
      code: 1006,
      msg: '该分类下有子模块，或已被学校使用，无法删除',
    },
    CODE_ALREADY_EXIST_ERROR: {
      code: 1007,
      msg: '编号已存在',
    },
    TARGET_IS_NOT_POWER_ERROR: {
      code: 1008,
      msg: '操作目标不是权限',
    },
    POWER_NOT_ALLOW_DELETE_ERROR: {
      code: 1009,
      msg: '该权限下有子权限，无法删除',
    },
    APP_NOT_ALLOW_DELETE_ERROR: {
      code: 1010,
      msg: '应用下有模块分类，无法删除',
    },
    POWER_CATEGORY_NOT_ALLOW_DELETE_ERROR: {
      code: 1011,
      msg: '该分类下有子权限，无法删除',
    },
  };
};
