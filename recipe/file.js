'use strict'

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const shell = require('shelljs')
const logger = require('../kernel/logger.js')

module.exports = function (config, context) {
  // copy vendor
  if (config.vendor) {
    shell.cp('-R', config.vendor, config.static)
    logger.info('file ::', 'copy vendor')
  }

  // copy entries
  var entries = getEntries(config, context)
  Object.keys(entries).forEach(function (entry) {
    var input = entries[entry]
    var output = path.join(config.static, entry + '.html')
    shell.mkdir('-p', path.dirname(output))
    shell.cp(input, output)
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
  var client = config.client.replace(/\/$/, '')
  var filter = config.filter && new RegExp(config.filter)
  var files = context.entries.length > 0 ?
    context.entries : glob.sync(client + '/**/index.html')
  files = files
    .filter(file => !/node_modules/.test(file))
    .filter(file => !filter || !filter.test(file))
    .filter(file => /index\.html$/.test(file))

  var entries = {}
  files.forEach(file => {
    var name = path.relative(client, file).slice(0, -5)
    entries[name] = file
  })
  return entries
}
