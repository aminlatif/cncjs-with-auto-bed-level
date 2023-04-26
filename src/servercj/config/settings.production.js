const crypto = require('crypto');
const os = require('os');
const path = require('path');
const urljoin = require('../lib/urljoin.js');
const pkg = require('../../../package.json');


const publicPath = ((payload) => {
  const algorithm = 'sha1';
  const buf = String(payload);
  const hash = crypto.createHash(algorithm).update(buf).digest('hex');
  return '/' + hash.substr(0, 8) + '/'; // 8 digits
})(pkg.version);

const maxAge = (365 * 24 * 60 * 60 * 1000); // one year

module.exports = {
  route: '/', // with trailing slash
  assets: {
    app: {
      routes: [ // with trailing slash
        urljoin(publicPath, '/'),
        '/' // fallback
      ],
      path: path.resolve(__dirname, '..', '..', '..', 'dist', 'app'),
      maxAge: maxAge
    }
  },
  backend: {
    enable: false, // disable backend service in production
    host: 'localhost',
    port: 80,
    route: 'api/'
  },
  cluster: {
    // note. node-inspector cannot debug child (forked) process
    enable: false,
    maxWorkers: os.cpus().length || 1
  },
  winston: {
    // https://github.com/winstonjs/winston#logging-levels
    level: 'info'
  }
};
