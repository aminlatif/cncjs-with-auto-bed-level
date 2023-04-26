const ImmutableStore = require('../lib/ImmutableStore.js');

const defaultState = {
  controllers: {}
};

const store = new ImmutableStore(defaultState);

module.exports = store;
