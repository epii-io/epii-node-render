'use strict'

const fs = require('fs')
const logger = require('./logger.js')

module.exports = {
  resolve,
  arrayify,
  tryWatch
}

function resolve(deps) {
  return Array.isArray(deps) ?
    deps.map(p => require.resolve(p)) : require.resolve(deps)
}

function arrayify(o) {
  return Array.isArray(o) ? o : [o]
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
    return logger.halt('invalid watch target')
  }
  if (!callback || typeof callback !== 'function') {
    return logger.halt('invalid watch callback')
  }

  return fs.watch(
    target, { persistent: true, recursive: true},
    function (e, file) {
      // todo: exact watch
      callback(e, file)
    }
  )
}
