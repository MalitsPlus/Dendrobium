const { _log, _warn, _err } = require('./utils/log');
const _ = require('lodash');
const dvid = require('./dvid');
const ds = require('./ds');
const retryPromise = require('./utils/retryPromise');

const act_id = 'e202009291139501';

const maskUid = uid => uid.substr(-3).padStart(uid.length, '*');

module.exports = class MysClient {
  constructor(cookie) {
    this.axios = require('axios').default.create({
      timeout: 10000,
      baseURL: 'https://api-takumi.mihoyo.com/',
      headers: {
        'x-rpc-device_id': dvid(),
        'x-rpc-client_type': '5',
        'x-rpc-app_version': '2.3.0',
        'user-agent':
          'Mozilla/5.0 (Linux; Android 5.1.1; f103 Build/LYZ28N; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/52.0.2743.100 Safari/537.36 miHoYoBBS/2.3.0',
        origin: 'https://webstatic.mihoyo.com',
        referer: `https://webstatic.mihoyo.com/bbs/event/signin-ys/index.html?bbs_auth_required=true&act_id=${act_id}&utm_source=bbs&utm_medium=mys&utm_campaign=icon`,
        cookie,
      },
    });
  }

  getRoles() {
    return retryPromise(
      () =>
        this.axios.get('/binding/api/getUserGameRolesByCookie?game_biz=hk4e_cn').then(({ data }) => {
          const list = _.get(data, 'data.list');
          if (!list) {
            global.failed = true;
            _err(JSON.stringify(data));
            return;
          }
          _log('角色信息请求成功');
          return list;
        }),
      e => _warn('角色信息请求失败，进行重试', e.toString()),
    ).catch(e => {
      global.failed = true;
      _err('角色信息请求失败', e.toString());
      return [];
    });
  }

  checkin({ region, game_uid: uid, region_name }) {
    return retryPromise(
      () =>
        this.axios
          .post('/event/bbs_sign_reward/sign', { act_id, region, uid }, { headers: { ds: ds() } })
          .then(({ data }) => {
            (() => {
              switch (data.retcode) {
                case 0:
                  return _log;
                case -5003:
                  return _warn;
                default:
                  global.failed = true;
                  return _err;
              }
            })()(maskUid(uid), region_name, JSON.stringify(data));
          }),
      e => _warn('签到请求失败，进行重试', e.toString()),
    ).catch(e => {
      global.failed = true;
      _err(maskUid(uid), region_name, '签到请求失败', e.toString());
    });
  }
};