'use strict'

const fs = require('fs')
const path = require('path')
const logger = require('./logger.js')

module.exports = {
  resolve,
  arrayify,
  tryWatch,
  getBabelConfig
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

/**
 * get babel config
 *
 * @param  {String} env
 * @return {Object} babel config
 */
function getBabelConfig(env) {
  var babelrcPath = path.join(__dirname, '.babelrc')
  var babelrc = JSON.parse(fs.readFileSync(babelrcPath))
  babelrc.presets = resolve(
    babelrc.presets.map(preset => 'babel-preset-' + preset)
  )
  if (!babelrc.plugins) babelrc.plugins = []
  return babelrc
}
