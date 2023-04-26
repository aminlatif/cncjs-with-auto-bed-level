const ensureBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null) {
    return Boolean(defaultValue);
  }

  return (typeof value === 'boolean') ? value : Boolean(value);
};

const ensureString = (value, defaultValue = '') => {
  if (value === undefined || value === null) {
    return String(defaultValue);
  }

  return (typeof value === 'string') ? value : String(value);
};

const ensureNumber = (value, defaultValue = 0) => {
  if (value === undefined || value === null) {
    return Number(defaultValue);
  }

  return (typeof value === 'number') ? value : Number(value);
};

module.exports = {
  ensureBoolean,
  ensureString,
  ensureNumber
};
