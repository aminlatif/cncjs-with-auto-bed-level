const CNCEngine = require('./CNCEngine.js');

const cncengine = new CNCEngine();

const start = (server, controller) => {
  cncengine.start(server, controller);
};

const stop = () => {
  cncengine.stop();
};

module.exports = {
  start,
  stop
};
