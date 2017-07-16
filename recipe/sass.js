'use strict'

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const shell = require('shelljs')
const postcss = require('postcss')
const precss = require('precss')
const logger = require('../kernel/logger.js')

module.exports = function (config, context) {
  // ctor postcss + precss processor
  var processor = postcss().use(precss)

  // process entries
  var entries = getEntries(config, context)
  Object.keys(entries).forEach(function (entry) {
    var input = entries[entry]
    var output = path.join(config.$path.target.client, entry + '.css')
    shell.mkdir('-p', path.dirname(output))

    var source = fs.readFileSync(input, 'utf8')
    processor.process(source, { from: input, to: output })
    .then(result => {
      fs.writeFileSync(output, result.css, 'utf8')
      var inputRelPath = path.relative(config.$path.source.client, input)
      var outputRelPath = path.relative(config.$path.target.client, output)
      logger.done('sass ::', `${inputRelPath} => ${outputRelPath}`)
    })
    .catch(error => {
      logger.halt('sass ::', 'failed to compile SASS')
      console.log(error.stack)
    })
  })
}

/**
 * get entries
 *
 * @param  {Object} config
 * @return {Object} webpack entries
 */
function getEntries(config, context) {
  var filter = config.filter && new RegExp(config.filter)
  var files = context.entries.length > 0
    ? context.entries
    : glob.sync(config.$path.source.client + '/**/index.scss')
  files = files
    .filter(file => !/node_modules/.test(file))
    .filter(file => !filter || !filter.test(file))
    .filter(file => /index\.scss$/.test(file))
  var entries = {}
  files.forEach(file => {
    var name = path.relative(config.$path.source.client, file).slice(0, -5)
    entries[name] = file
  })
  return entries
}
