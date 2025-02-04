const _ = require('lodash');

class TinyGLineParserResultStatusReports {
  static parse(data) {
    const sr = _.get(data, 'r.sr') || _.get(data, 'sr');
    if (!sr) {
      return null;
    }

    const payload = {
      sr: sr
    };

    return {
      type: TinyGLineParserResultStatusReports,
      payload: payload
    };
  }
}

module.exports = TinyGLineParserResultStatusReports;
