'use strict'

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const shell = require('shelljs')
const webpack = require('webpack')
const assist = require('../kernel/assist.js')
const logger = require('../kernel/logger.js')

module.exports = function (config, context) {
  if (config.simple) {
    // copy entries
    var entries = getEntries(config, context)
    Object.keys(entries).forEach(entry => {
      var source = entries[entry]
      var target = path.join(config.$path.target.client, entry + '.js')
      shell.mkdir('-p', path.dirname(target))
      shell.cp(source, target)
      logger.info('pure ::', `copy ${entry}.js`)
    })

    return logger.warn('pure ::', 'pass simple scripts')
  }

  // generate webpack config
  var entries = getEntries(config, context)
  if (Object.keys(entries).length === 0) return
  var webpackConfig = getWebpackConfig(config, context)
  webpackConfig.entry = entries

  // compiler pure js
  var compiler = webpack(webpackConfig)
  compiler.plugin('done', stats => {
    var errors = stats.compilation.errors
    if (errors) {
      if (config.logger && errors.length) {
        errors.forEach(error => {
          console.log(error.message)
        })
      }
    }
    var assets = stats.toJson({ assets: true }).assets
    if (assets.length > 0) {
      logger.done('pure ::', `[${assets.map(asset => asset.name).join(',')}]`)
    }
  })
  logger.warn('pure ::', 'webpack working...')
  compiler.run(function (error, stats) {
    if (error) console.log(error)
  })
}

/**
 * get entries
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Object} webpack entries
 */
function getEntries(config, context) {
  var filter = config.filter && new RegExp(config.filter)
  var files = context.entries.length > 0
    ? context.entries
    : glob.sync(config.$path.source.client + '/**/index.js')
  files = files
    .filter(file => !/node_modules/.test(file))
    .filter(file => !filter || !filter.test(file))
    .filter(file => /index\.js$/.test(file))
  var entries = {}
  files.forEach(file => {
    var name = path.relative(config.$path.source.client, file).slice(0, -3)
    entries[name] = file
  })
  return entries
}

/**
 * get webpack config
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Object} result - webpack config
 */
function getWebpackConfig(config, context) {
  var webpackConfig = {
    module: {
      rules: [
        {
          exclude: /node_modules/,
          loader: assist.resolve('babel-loader'),
          test: /\.(es6|js)$/
        }
      ]
    },
    output: {
      path: config.$path.target.client,
      filename: '[name].js'
    },
    resolve: {
      extensions: ['.js'],
      alias: config.alias || {}
    },
    externals: {}
  }

  var babelConfig = assist.getBabelConfig(context.env)
  var babelLoader = webpackConfig.module.rules
    .find(rule => rule.loader && /babel/.test(rule.loader))
  babelLoader.options = babelConfig

  var processEnv = {
    'process.env': {
      NODE_ENV: JSON.stringify(context.env || 'production'),
      IS_BROWSER: true
    }
  }
  if (context.env === 'development') {
    // development env
    webpackConfig.plugins = [
      new webpack.DefinePlugin(processEnv)
    ]
  } else {
    // production env
    webpackConfig.plugins = [
      new webpack.DefinePlugin(processEnv),
      new webpack.optimize.CommonsChunkPlugin({ name: 'common' }),
      new webpack.optimize.UglifyJsPlugin({ sourceMap: false })
    ]
  }

  return webpackConfig
}
