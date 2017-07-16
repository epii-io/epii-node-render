'use strict'

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const assist = require('../kernel/assist.js')
const logger = require('../kernel/logger.js')

module.exports = function (config, context) {
  if (config.simple) {
    logger.warn('pure ::', 'pass simple scripts')
    return copyFiles(config, context)
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
      // disable handling of unknown requires
      unknownContextRegExp: /$^/,
      unknownContextCritical: false,

      // disable handling of requires with a single expression
      exprContextRegExp: /$^/,
      exprContextCritical: false,

      // warn for every expression in require
      wrappedContextCritical: true,

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

  var babelConfig = getBabelConfig(context.env)
  var babelLoader = webpackConfig.module.rules
    .find(rule => rule.loader && /babel/.test(rule.loader))
  babelLoader.options = babelConfig

  var processEnv = {
    'process.env': {
      NODE_ENV: `"${context.env || 'production'}"`,
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
      new webpack.optimize.UglifyJsPlugin({})
    ]
  }

  return webpackConfig
}

/**
 * get babel config
 *
 * @param  {String} env
 * @return {Object} babel config
 */
function getBabelConfig(env) {
  var babelrc = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../.babelrc'))
  )
  babelrc.presets = assist.resolve(
    babelrc.presets.map(preset => 'babel-preset-' + preset)
  )
  babelrc.plugins = babelrc.plugins || []
  return babelrc
}

/**
 * copy files
 *
 * @param  {Object} config
 * @param  {Object} context
 */
function copyFiles(config, context) {
  var entries = getEntries(config, context)
  Object.keys(entries).forEach(name => {
    var source = entries[name]
    var target = path.join(config.$path.target.client, name + '.js')
    fs.readFile(source, 'utf8', function (error, body) {
      if (error) return logger.halt('pure ::', 'invalid source')
      fs.writeFile(target, body, 'utf8', function (error) {
        if (error) return logger.halt('pure ::', `failed to copy ${name}.js`)
        logger.done('pure ::', `copy ${name}.js`)
      })
    })
  })
}
