const version = require('./api.version.js');
const state = require('./api.state.js');
const gcode = require('./api.gcode.js');
const controllers = require('./api.controllers.js');
const watch = require('./api.watch.js');
const commands = require('./api.commands.js');
const events = require('./api.events.js');
const machines = require('./api.machines.js');
const macros = require('./api.macros.js');
const mdi = require('./api.mdi.js');
const users = require('./api.users.js');
const bedlevel = require('./api.bedlevel.js');

module.exports = {
  version,
  state,
  gcode,
  controllers,
  watch,
  commands,
  events,
  machines,
  macros,
  mdi,
  users,
  bedlevel
};
