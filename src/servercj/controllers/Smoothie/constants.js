// Smoothie
const SMOOTHIE = 'Smoothie';

// Active State
const SMOOTHIE_ACTIVE_STATE_IDLE = 'Idle';
const SMOOTHIE_ACTIVE_STATE_RUN = 'Run';
const SMOOTHIE_ACTIVE_STATE_HOLD = 'Hold';
const SMOOTHIE_ACTIVE_STATE_DOOR = 'Door';
const SMOOTHIE_ACTIVE_STATE_HOME = 'Home';
const SMOOTHIE_ACTIVE_STATE_ALARM = 'Alarm';
const SMOOTHIE_ACTIVE_STATE_CHECK = 'Check';

// Real-time Commands: ~, !, ?, and Ctrl-x
const SMOOTHIE_REALTIME_COMMANDS = [
  '~', // Cycle Start
  '!', // Feed Hold
  '?', // Current Status
  '\x18' // Reset (Ctrl-X)
];

// http://linuxcnc.org/docs/html/gcode/overview.html#cap:modal-groups
const SMOOTHIE_MODAL_GROUPS = [
  { // Motion Mode (Defaults to G0)
    group: 'motion',
    modes: ['G0', 'G1', 'G2', 'G3', 'G38.2', 'G38.3', 'G38.4', 'G38.5', 'G80']
  },
  { // Work Coordinate System Select (Defaults to G54)
    group: 'wcs',
    modes: ['G54', 'G55', 'G56', 'G57', 'G58', 'G59']
  },
  { // Plane Select (Defaults to G17)
    group: 'plane',
    modes: ['G17', 'G18', 'G19']
  },
  { // Units Mode (Defaults to G21)
    group: 'units',
    modes: ['G20', 'G21']
  },
  { // Distance Mode (Defaults to G90)
    group: 'distance',
    modes: ['G90', 'G91']
  },
  { // Feed Rate Mode (Defaults to G94)
    group: 'feedrate',
    modes: ['G93', 'G94']
  },
  { // Program Mode (Defaults to M0)
    group: 'program',
    modes: ['M0', 'M1', 'M2', 'M30']
  },
  { // Spindle State (Defaults to M5)
    group: 'spindle',
    modes: ['M3', 'M4', 'M5']
  },
  { // Coolant State (Defaults to M9)
    group: 'coolant',
    modes: ['M7', 'M8', 'M9']
  }
];

module.exports = {
  SMOOTHIE,
  SMOOTHIE_ACTIVE_STATE_IDLE,
  SMOOTHIE_ACTIVE_STATE_RUN,
  SMOOTHIE_ACTIVE_STATE_HOLD,
  SMOOTHIE_ACTIVE_STATE_DOOR,
  SMOOTHIE_ACTIVE_STATE_HOME,
  SMOOTHIE_ACTIVE_STATE_ALARM,
  SMOOTHIE_ACTIVE_STATE_CHECK,
  SMOOTHIE_REALTIME_COMMANDS,
  SMOOTHIE_MODAL_GROUPS
};
