const _ = require('lodash');

// https://github.com/synthetos/TinyG/wiki/Power-Management
class TinyGLineParserResultPowerManagement {
  static parse(data) {
    const pwr = _.get(data, 'r.pwr');
    if (typeof pwr === 'undefined') {
      return null;
    }

    const footer = _.get(data, 'f') || [];
    const statusCode = footer[1];
    const payload = {};
    if (pwr && statusCode === 0) {
      payload.pwr = pwr;
    }

    return {
      type: TinyGLineParserResultPowerManagement,
      payload: payload
    };
  }
}

module.exports = TinyGLineParserResultPowerManagement;
