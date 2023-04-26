const deepKeys = require('deep-keys');
const _ = require('lodash');
const config = require('../services/configstore/index.js');
const {
  ERR_NOT_FOUND
} = require('../constants/index.js');

const get = (req, res) => {
  const query = req.query || {};

  if (!query.key) {
    res.send(config.get('state'));
    return;
  }

  const key = `state.${query.key}`;
  if (!config.has(key)) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  const value = config.get(key);
  res.send(value);
};

const unset = (req, res) => {
  const query = req.query || {};

  if (!query.key) {
    res.send(config.get('state'));
    return;
  }

  const key = `state.${query.key}`;
  if (!config.has(key)) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  config.unset(key);
  res.send({ err: false });
};

const set = (req, res) => {
  const query = req.query || {};
  const data = { ...req.body };

  if (query.key) {
    config.set(`state.${query.key}`, data);
    res.send({ err: false });
    return;
  }

  deepKeys(data).forEach((key) => {
    const oldValue = config.get(`state.${key}`);
    const newValue = _.get(data, key);

    if (typeof oldValue === 'object' && typeof newValue === 'object') {
      config.set(`state.${key}`, {
        ...oldValue,
        ...newValue
      });
    } else {
      config.set(`state.${key}`, newValue);
    }
  });

  res.send({ err: false });
};

module.exports = {
  get,
  set,
  unset
};
