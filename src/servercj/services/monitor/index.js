const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');
const FSMonitor = require('./FSMonitor.js');

const monitor = new FSMonitor();

const start = ({ watchDirectory }) => {
  monitor.watch(watchDirectory);
};

const stop = () => {
  monitor.unwatch();
};

const getFiles = (searchPath) => {
  const root = path.normalize(monitor.root);
  const files = Object.keys(monitor.files);
  const pattern = path.join(root, searchPath, '*');

  if (!root || pattern.indexOf(root) !== 0) {
    return [];
  }

  return minimatch
    .match(files, pattern, { matchBase: true })
    .map(file => {
      const stat = monitor.files[file] || {};

      return {
        name: path.basename(file),
        type: (function() {
          if (stat.isFile()) {
            return 'f';
          }
          if (stat.isDirectory()) {
            return 'd';
          }
          if (stat.isBlockDevice()) {
            return 'b';
          }
          if (stat.isCharacterDevice()) {
            return 'c';
          }
          if (stat.isSymbolicLink()) {
            return 'l';
          }
          if (stat.isFIFO()) {
            return 'p';
          }
          if (stat.isSocket()) {
            return 's';
          }
          return '';
        }()),
        size: stat.size,
        atime: stat.atime,
        mtime: stat.mtime,
        ctime: stat.ctime
      };
    });
};

const readFile = (file, callback) => {
  const root = monitor.root;
  file = path.join(root, file);

  fs.readFile(file, 'utf8', callback);
};

module.exports = {
  start,
  stop,
  getFiles,
  readFile
};
