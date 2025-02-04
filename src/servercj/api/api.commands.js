const find = require('lodash/find.js');
const castArray = require('lodash/castArray.js');
const isPlainObject = require('lodash/isPlainObject.js');
const uuid = require('uuid');
const settings = require('../config/settings.js');
const logger = require('../lib/logger.js').default;
const taskRunner = require('../services/taskrunner/index.js');
const config = require('../services/configstore/index.js');
const { getPagingRange } = require('./paging.js');
const {
  ERR_BAD_REQUEST,
  ERR_NOT_FOUND,
  ERR_INTERNAL_SERVER_ERROR
} = require('../constants/index.js');

const log = logger('api:commands');
const CONFIG_KEY = 'commands';

const getSanitizedRecords = () => {
  const records = castArray(config.get(CONFIG_KEY, []));

  let shouldUpdate = false;
  for (let i = 0; i < records.length; ++i) {
    if (!isPlainObject(records[i])) {
      records[i] = {};
    }

    const record = records[i];

    if (!record.id) {
      record.id = uuid.v4();
      shouldUpdate = true;
    }

    // Defaults to true
    if (record.enabled === undefined) {
      record.enabled = true;
    }

    // Alias command
    if (!record.commands) {
      record.commands = record.command || '';
      delete record.command;
    }
  }

  if (shouldUpdate) {
    log.debug(`update sanitized records: ${JSON.stringify(records)}`);

    // Pass `{ silent changes }` will suppress the change event
    config.set(CONFIG_KEY, records, { silent: true });
  }

  return records;
};

const fetch = (req, res) => {
  const records = getSanitizedRecords();
  const paging = !!req.query.paging;

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
      records: pagedRecords.map(record => {
        const { id, mtime, enabled, title, commands } = { ...record };
        return { id, mtime, enabled, title, commands };
      })
    });
  } else {
    res.send({
      records: records.map(record => {
        const { id, mtime, enabled, title, commands } = { ...record };
        return { id, mtime, enabled, title, commands };
      })
    });
  }
};

const create = (req, res) => {
  const {
    enabled = true,
    title = '',
    commands = ''
  } = { ...req.body };

  if (!title) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'The "title" parameter must not be empty'
    });
    return;
  }

  if (!commands) {
    res.status(ERR_BAD_REQUEST).send({
      msg: 'The "commands" parameter must not be empty'
    });
    return;
  }

  try {
    const records = getSanitizedRecords();
    const record = {
      id: uuid.v4(),
      mtime: new Date().getTime(),
      enabled: !!enabled,
      title: title,
      commands: commands
    };

    records.push(record);
    config.set(CONFIG_KEY, records);

    res.send({ id: record.id, mtime: record.mtime });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

const read = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = find(records, { id: id });

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  const { mtime, enabled, title, commands } = { ...record };
  res.send({ id, mtime, enabled, title, commands });
};

const update = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = find(records, { id: id });

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  const {
    enabled = record.enabled,
    title = record.title,
    commands = record.commands
  } = { ...req.body };

  // Skip validation for "enabled", "title", and "commands"

  try {
    record.mtime = new Date().getTime();
    record.enabled = Boolean(enabled);
    record.title = String(title || '');
    record.commands = String(commands || '');

    // Remove deprecated parameter
    if (record.command !== undefined) {
      delete record.command;
    }

    config.set(CONFIG_KEY, records);

    res.send({ id: record.id, mtime: record.mtime });
  } catch (err) {
    res.status(ERR_INTERNAL_SERVER_ERROR).send({
      msg: 'Failed to save ' + JSON.stringify(settings.rcfile)
    });
  }
};

const __delete = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = find(records, { id: id });

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

const run = (req, res) => {
  const id = req.params.id;
  const records = getSanitizedRecords();
  const record = find(records, { id: id });

  if (!record) {
    res.status(ERR_NOT_FOUND).send({
      msg: 'Not found'
    });
    return;
  }

  const title = record.title;
  const commands = record.commands;

  log.info(`run: title="${title}", commands="${commands}"`);

  const taskId = taskRunner.run(commands, title);

  res.send({ taskId: taskId });
};

module.exports = {
  fetch,
  create,
  read,
  update,
  __delete,
  run
};
