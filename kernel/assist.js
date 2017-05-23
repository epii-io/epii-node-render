'use strict'

const fs = require('fs')
const path = require('path')
const logger = require('./logger.js')

module.exports = {
  arrayify,
  resolve,
  watchex
}

function arrayify(o) {
  return Array.isArray(o) ? o : [o]
}

function resolve(deps) {
  return Array.isArray(deps) ?
    deps.map(p => require.resolve(p)) : require.resolve(deps)
}

function watchex(target, handle) {
  if (!target) {
    return logger.halt('invalid target')
  }
  if (!handle || typeof handle !== 'function') {
    return logger.halt('invalid watch handler')
  }

  var watcher = fs.watch(
    target,
    { persistent: true, recursive: true},
    (e, file) => {
      logger.warn(`${e} ${file}`)
      handle(file)
    }
  )
  logger.warn(`watching ${path.relative(process.cwd(), target)}`)
  return watcher
}
