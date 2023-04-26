// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects
const GLOBAL_OBJECTS = {
  // Function properties
  parseFloat,
  parseInt,

  // Fundamental objects
  Object,
  Function,
  Boolean,

  // Numbers and dates
  Number,
  Math,
  Date,

  // Text processing
  String,
  RegExp,

  // Structured data
  JSON,
};

// Write Source
const WRITE_SOURCE_CLIENT = 'client';
const WRITE_SOURCE_SERVER = 'server';
const WRITE_SOURCE_FEEDER = 'feeder';
const WRITE_SOURCE_SENDER = 'sender';

module.exports = {
  GLOBAL_OBJECTS,
  WRITE_SOURCE_CLIENT,
  WRITE_SOURCE_SERVER,
  WRITE_SOURCE_FEEDER,
  WRITE_SOURCE_SENDER,
};
