const decimalPlaces = require('../../lib/decimal-places.js');

class MarlinLineParserResultPosition {
  // X:0.00 Y:0.00 Z:0.00 E:0.00 Count X:0 Y:0 Z:0
  // X:20.000 Y:41.000 Z:38.000 A:34.000 B:24.000 C:17.000 Count X:9311 Y:18922 Z:15200 A:536 B:378 C:268
  static parse(line) {
    const r = line.match(/^(?:(?:X|Y|Z|A|B|C|E):[0-9\.\-]+\s+)+/i);
    if (!r) {
      return null;
    }

    const payload = {
      pos: {}
    };
    const pattern = /((X|Y|Z|A|B|C|E):[0-9\.\-]+)+/gi;
    const params = r[0].match(pattern);

    for (let param of params) {
      const nv = param.match(/^(.+):(.+)/);
      if (nv) {
        const axis = nv[1].toLowerCase();
        const pos = nv[2];
        const digits = decimalPlaces(pos);
        payload.pos[axis] = Number(pos).toFixed(digits);
      }
    }

    return {
      type: MarlinLineParserResultPosition,
      payload: payload
    };
  }
}

module.exports = MarlinLineParserResultPosition;
