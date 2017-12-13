'use strict'

const path = require('path')
const glob = require('glob')
const shell = require('shelljs')
const logger = require('../kernel/logger.js')

module.exports = function (config, context) {
  // copy vendor
  shell.cp('-R', config.$path.source.vendor, config.$path.target.static)
  logger.info('file ::', 'copy vendor')

  // copy entries
  var entries = getEntries(config, context)
  Object.keys(entries).forEach(entry => {
    var source = entries[entry]
    var target = path.join(config.$path.target.client, entry + '.html')
    shell.mkdir('-p', path.dirname(target))
    shell.cp(source, target)
    logger.info('file ::', `copy ${entry}.html`)
  })
}

/**
 * get entries
 * client > index.* (non js/jsx/scss)
 * up to now: only support index.html
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Object} entries
 */
function getEntries(config, context) {
  var filter = config.filter && new RegExp(config.filter)
  var files = context.entries.length > 0
    ? context.entries
    : glob.sync(config.$path.source.client + '/**/index.html')
  files = files
    .filter(file => !/node_modules/.test(file))
    .filter(file => !filter || !filter.test(file))
    .filter(file => /index\.html$/.test(file))

  var entries = {}
  files.forEach(file => {
    var name = path.relative(config.$path.source.client, file).slice(0, -5)
    entries[name] = file
  })
  return entries
}
