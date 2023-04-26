const _ = require('lodash');
const TinyGLineParserResultMotorTimeout = require('./TinyGLineParserResultMotorTimeout.js');
const TinyGLineParserResultPowerManagement = require('./TinyGLineParserResultPowerManagement.js');
const TinyGLineParserResultQueueReports = require('./TinyGLineParserResultQueueReports.js');
const TinyGLineParserResultStatusReports = require('./TinyGLineParserResultStatusReports.js');
const TinyGLineParserResultSystemSettings = require('./TinyGLineParserResultSystemSettings.js');
const TinyGLineParserResultOverrides = require('./TinyGLineParserResultOverrides.js');
const TinyGLineParserResultReceiveReports = require('./TinyGLineParserResultReceiveReports.js');

class TinyGLineParser {
  parse(data) {
    const parsers = [
      TinyGLineParserResultMotorTimeout,
      TinyGLineParserResultPowerManagement,
      TinyGLineParserResultQueueReports,
      TinyGLineParserResultStatusReports,
      TinyGLineParserResultSystemSettings,
      TinyGLineParserResultOverrides,
      TinyGLineParserResultReceiveReports
    ];

    for (let parser of parsers) {
      const result = parser.parse(data);
      if (result) {
        _.set(result, 'payload.raw', data);
        _.set(result, 'payload.f', data.f || []); // footer
        return result;
      }
    }

    return {
      type: null,
      payload: {
        raw: data,
        f: data.f || [] // footer
      }
    };
  }
}

module.exports = TinyGLineParser;
