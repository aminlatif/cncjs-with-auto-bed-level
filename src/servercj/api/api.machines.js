const _get = require('lodash/get');
const _set = require('lodash/set');
const _find = require('lodash/find');
const _castArray = require('lodash/castArray');
const _isPlainObject = require('lodash/isPlainObject');
const uuid = require('uuid');
const settings = require('../config/settings');
const { ensureNumber, ensureString } = require('../lib/ensure-type');
const logger = require('../lib/logger').default;
const config = require('../services/configstore');
const HeightInfo = require('../lib/HeightInfo');
const { getPagingRange } = require('./paging');
const {
  ERR_BAD_REQUEST,
  ERR_NOT_FOUND,
  ERR_INTERNAL_SERVER_ERROR
} = require('../constants');

const log = logger('api:machines');
const CONFIG_KEY = 'machines';

const getSanitizedRecords = () => {
  const records = _castArray(config.get(CONFIG_KEY, []));

  log.debug('****** Getting Sanitized Machine Profile.');

  let shouldUpdate = false;
  for (let i = 0; i < records.length; ++i) {
    if (!_isPlainObject(records[i])) {
      records[i] = {};
    }

    const record = records[i];
    record.determinedHeightInfo = new HeightInfo(record.heightInfo, record.limits);
    record.determinedHeightInfo.determineAllHeightInfos();
    // const heightInfoObject = convertHeightInfoStringToObject(record.heightInfo);
    // record.heightInfo = heightInfoObject;
    // record.calcualtedHeightInfo = getcalcualtedHeightInfo(heightInfoObject, record.limits);

    if (!record.id) {
      record.id = uuid.v4();
      shouldUpdate = true;
    }
  }

  if (shouldUpdate) {
    log.debug(`update sanitized records: ${JSON.stringify(records)}`);

    // Pass `{ silent changes }` will suppress the change event
    config.set(CONFIG_KEY, records, { silent: true });
  }

  return records;
};

const ensureMachineProfile = (payload) => {
  const { id, name, limits, heightInfo, determinedHeightInfo } = { ...payload };
  const { xmin = 0, xmax = 0, ymin = 0, ymax = 0, zmin = 0, zmax = 0 } = { ...limits };
  const { availableXmin = 0, availableXmax = 0, availableYmin = 0, availableYmax = 0, availableZmin = 0, availableZmax = 0, } = { ...limits };

  log.debug('****** Ensuring Machine Profile.');

  return {
    id,
    name: ensureString(name),
    heightInfo: heightInfo,
    determinedHeightInfo: determinedHeightInfo,
    limits: {
      xmin: ensureNumber(xmin) || 0,
      xmax: ensureNumber(xmax) || 0,
      ymin: ensureNumber(ymin) || 0,
      ymax: ensureNumber(ymax) || 0,
      zmin: ensureNumber(zmin) || 0,
      zmax: ensureNumber(zmax) || 0,
      availableXmin: ensureNumber(availableXmin) || 0,
      availableXmax: ensureNumber(availableXmax) || 0,
      availableYmin: ensureNumber(availableYmin) || 0,
      availableYmax: ensureNumber(availableYmax) || 0,
      availableZmin: ensureNumber(availableZmin) || 0,
      availableZmax: ensureNumber(availableZmax) || 0
    }
  };
};

const fetch = (req, res) => {
  const records = getSanitizedRecords();
  const paging = !!req.query.paging;

  log.debug('****** Fetching Machine Profile.');

  if (paging) {
    const { page = 1, pageLength = 10 } = req.query;
    const totalRecords = records.length;
    const [begin, end] = getPagingRange({ page, pageLength, totalRecords });
    const pagedRecords = records.slice(begin, end);

    res.send({
      pagination: {
        page: Number(page),
        pageLength: Number(pageLength),
        totalRecords: Number(totalRecords)
      },
      records: pagedRecords.map(record => ensureMachineProfile(record))
    });
  } else {
    res.send({
      records: records.map(record => ensureMachineProfile(record))
    });
  }
};

const create = (req, res) => {
  const record = { ...req.body };

  log.debug('****** Creating Machine Profile.');

  if (!record.name) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'The "name" parameter must not be empty'
    });
    return;
  }

  try {
    const records = getSanitizedRecords();
    records.push(ensureMachineProfile(record));
    config.set(CONFIG_KEY, records);

    res.send({ id: record.id });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

const read = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = _find(records, { id: id });

  log.debug('****** Reading Machine Profile.');

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  res.send(ensureMachineProfile(record));
};

const update = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = _find(records, { id: id });

  log.debug('****** Updating Machine Profile.');

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  try {
    const nextRecord = req.body;

    [ // [key, ensureType]
      ['name', ensureString],
      ['heightInfo', ensureString],
      ['limits.xmin', ensureNumber],
      ['limits.xmax', ensureNumber],
      ['limits.ymin', ensureNumber],
      ['limits.ymax', ensureNumber],
      ['limits.zmin', ensureNumber],
      ['limits.zmax', ensureNumber],
      ['limits.availableXmin', ensureNumber],
      ['limits.availableXmax', ensureNumber],
      ['limits.availableYmin', ensureNumber],
      ['limits.availableYmax', ensureNumber],
      ['limits.availableZmin', ensureNumber],
      ['limits.availableZmax', ensureNumber]
    ].forEach(it => {
      const [key, ensureType] = it;
      const defaultValue = _get(record, key);
      const value = _get(nextRecord, key, defaultValue);
      _set(record, key, (typeof ensureType === 'function') ? ensureType(value) : value);
    });

    config.set(CONFIG_KEY, records);

    res.send({ id: record.id });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

const __delete = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = _find(records, { id: id });

  log.debug('****** Deleting Machine Profile.');

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  try {
    const filteredRecords = records.filter(record => {
      return record.id !== id;
    });
    config.set(CONFIG_KEY, filteredRecords);

    res.send({ id: record.id });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

const updateHeightInfo = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = _find(records, { id: id });

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  try {
    const nextRecord = req.body;
    console.log('updating heightInfo to', nextRecord.heightInfo);
    [ // [key, ensureType]
      ['heightInfo', ensureString],
    ].forEach(it => {
      const [key, ensureType] = it;
      const defaultValue = _get(record, key);
      const value = _get(nextRecord, key, defaultValue);
      _set(record, key, (typeof ensureType === 'function') ? ensureType(value) : value);
    });

    records.forEach((record) => {
      delete record.determinedHeightInfo;
    });

    config.set(CONFIG_KEY, records);

    res.send({ id: record.id });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

module.exports = {
  fetch,
  create,
  read,
  update,
  __delete,
  updateHeightInfo
};
