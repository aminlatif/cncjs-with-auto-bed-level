const merge = require('lodash/merge.js');
const base = require('./settings.base.js');
const development = require('./settings.development.js');
const production = require('./settings.production.js');

const env = process.env.NODE_ENV || 'production'; // Ensure production environment if empty
const settings = {};

if (env === 'development') {
  merge(settings, base, development, { env: env });
} else {
  merge(settings, base, production, { env: env });
}

module.exports = settings;
