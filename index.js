'use strict'

const path = require('path')
const shell = require('shelljs')
const assist = require('./kernel/assist.js')
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
 * build once, default production
 */
function buildOnce(config) {
  // set default holder
  if (!config.holder) {
    config.holder = { name: 'app', stub: 'epii' }
  }

  // prepare static dir
  shell.mkdir('-p', config.static)

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
  // set development env
  CONTEXT.env = 'development'

  // build once immediately
  buildOnce(config)

  // bind watch handler
  assist.tryWatch(
    config.client,
    function (e, file) {
      if (!file) return
      CONTEXT.entries.push(path.join(config.client, file))
      buildOnce(config, CONTEXT)
      CONTEXT.entries = []
    }
  )
}
