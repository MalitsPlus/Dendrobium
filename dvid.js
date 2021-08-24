// 用于生成 deviceID，随机UUID即可
const { v4 } = require('uuid');
module.exports = () => v4().replace(/-/g, '').toUpperCase();