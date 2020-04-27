const fs = require('fs');
const path = require('path');
const logger = require('./logger.js');
const chokidar = require('chokidar');

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB'];

function resolve(deps) {
  return Array.isArray(deps)
    ? deps.map(p => require.resolve(p))
    : require.resolve(deps);
}

function arrayify(o) {
  return Array.isArray(o) ? o : [o];
}

function toBigBytesUnit(value) {
  let size = Number(value);
  let unit = 0;
  while (size > 1000) {
    size /= 1024;
    unit += 1;
  }
  return `${unit > 0 ? size.toFixed(2) : size}${BYTE_UNITS[unit]}`;
}

/**
 * try to watch with custom callback
 *
 * @param  {String} target
 * @param  {Function} callback
 * @return {Object} fs.Watcher
 */
function tryWatch(target, callback) {
  if (!target) {
    return logger.halt('invalid watch target');
  }
  if (!callback || typeof callback !== 'function') {
    return logger.halt('invalid watch callback');
  }
  return chokidar.watch(
    target,
    {
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false
    }
  )
    .on('all', callback);
}

/**
 * get babel config
 *
 * @return {Object} babel config
 */
function getBabelConfig() {
  const babelrcPath = path.join(__dirname, '.babelrc');
  const babelrc = JSON.parse(fs.readFileSync(babelrcPath));
  babelrc.presets = resolve(babelrc.presets.map(preset => '@babel/preset-' + preset));
  if (!babelrc.plugins) babelrc.plugins = [];
  return babelrc;
}

function hideErrorStack(message) {
  const lines = message.split(/\n\s+at\s+/);
  if (lines.length > 0) return `\n${lines[0]}\n`;
  return message;
}

module.exports = {
  resolve,
  arrayify,
  tryWatch,
  toBigBytesUnit,
  getBabelConfig,
  hideErrorStack
};
