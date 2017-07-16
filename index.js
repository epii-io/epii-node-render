'use strict'

const path = require('path')
const shell = require('shelljs')
const assist = require('./kernel/assist.js')
const logger = require('./kernel/logger.js')
const pureRecipe = require('./recipe/pure.js')
const viewRecipe = require('./recipe/view.js')
const sassRecipe = require('./recipe/sass.js')
const fileRecipe = require('./recipe/file.js')

const CONTEXT = {
  env: 'production',
  entries: []
}

module.exports = {
  build: buildOnce,
  watch: watchBuild
}

/**
 * guard config
 *
 * @param  {Object} config
 * @return {Object}
 */
function lintConfig(config) {
  if (!config.path) return logger.halt('null config.path')
  if (!config.path.root) return logger.halt('null config.path.root')
  if (!config.path.client) return logger.halt('null config.path.client')
  if (!config.path.static) return logger.halt('null config.path.static')
  if (!config.path.vendor) return logger.halt('null config.path.vendor')
  config.path.client = config.path.client.replace(/\/$/, '')
  var staticDir = path.join(config.path.root, config.path.static)
  config.$path = {
    source: {
      client: path.join(config.path.root, config.path.client),
      vendor: path.join(config.path.root, config.path.vendor)
    },
    target: {
      static: staticDir,
      client: path.join(staticDir, config.path.client),
      vendor: path.join(staticDir, config.path.vendor)
    }
  }
  return config
}

/**
 * build once, default production
 */
function buildOnce(config) {
  // verify config
  if (!lintConfig(config)) throw new Error('invalid config')

  // set default holder
  if (!config.holder) {
    config.holder = { name: 'app', stub: 'epii' }
  }

  // prepare static dir
  shell.mkdir('-p', config.$path.target.client)
  shell.mkdir('-p', config.$path.target.vendor)

  // process source
  pureRecipe(config, CONTEXT)
  viewRecipe(config, CONTEXT)
  sassRecipe(config, CONTEXT)
  fileRecipe(config, CONTEXT)
}

/**
 * watch & build, development
 */
function watchBuild(config) {
  // verify config
  if (!lintConfig(config)) throw new Error('invalid config')

  // set development env
  CONTEXT.env = 'development'

  // build once immediately
  buildOnce(config)

  // bind watch handler
  assist.tryWatch(
    config.$path.source.client,
    function (e, file) {
      if (!file) return
      CONTEXT.entries.push(path.join(config.$path.source.client, file))
      buildOnce(config, CONTEXT)
      CONTEXT.entries = []
    }
  )
}
