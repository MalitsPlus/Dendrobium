/** 参考自 https://github.com/Tsuk1ko/genshin-mys-checkin **/

const { _log, _err, _setFailed } = require('./utils/log');
const _ = require('lodash');
const Fs = require('fs-extra');
const Base64 = require('js-base64');
const { get } = require('axios').default;
const MysClient = require('./client');
const sleep = require('./utils/sleep');

_.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

const getWbConfig = () => {
  if (Fs.existsSync('wbconfig.json')) {
    try {
      return Fs.readJsonSync('wbconfig.json');
    } catch (error) {
      _err('wbconfig.json 格式错误', e.toString());
    }
  }
  if (!Base64.isValid(process.env.WB_CONFIG)) return [];
  try {
    return JSON.parse(Base64.decode(process.env.WB_CONFIG));
  } catch (e) {
    _err('WB_CONFIG 配置错误', e.toString());
  }
  return [];
};

const getConfig = async () => {
  let config = {};
  if (process.env.CONFIG_URL) {
    try {
      const { data } = await get(process.env.CONFIG_URL);
      config = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (e) {
      _err('CONFIG_URL 配置错误', e.toString());
    }
  } else if (Fs.existsSync('config.json')) {
    try {
      config = Fs.readJsonSync('config.json');
    } catch (e) {
      _err('config.json 格式错误', e.toString());
    }
  }
  return config;
};

/*************   Main Method   *************/
(async () => {
  // 获取配置文件
  const config = await getConfig();
  // 获取cookies
  const mysCookies = config.mys || (process.env.COOKIE || '').split('#').filter(cookie => cookie);

  if (mysCookies.length) {
    _log('\nMYS');
    for (const cookie of mysCookies) {
      const mysClient = new MysClient(cookie);
      const roles = await mysClient.getRoles();
      for (const role of roles) {
        await mysClient.checkin(role);
        await sleep(3000);
      }
    }
  }
  _log();
  if (global.failed) _setFailed();
})();