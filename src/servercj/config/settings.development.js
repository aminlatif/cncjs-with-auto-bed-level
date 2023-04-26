const os = require('os');
const path = require('path');

const maxAge = 0;

module.exports = {
  route: '/', // with trailing slash
  assets: {
    app: {
      routes: [
        '' // empty path
      ],
      path: path.resolve(__dirname, '..', '..', '..', 'dist', 'app'),
      maxAge: maxAge
    }
  },
  backend: {
    enable: true,
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
    level: 'debug'
  }
};
