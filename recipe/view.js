'use strict'

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const assist = require('../kernel/assist.js')
const logger = require('../kernel/logger.js')

module.exports = function (config, context) {
  if (!config.client) {
    return logger.halt('view ::', 'invalid config client')
  }
  if (!config.static) {
    return logger.halt('view ::', 'invalid config static')
  }

  // write launch code
  if (context.entries.length === 0) {
    writeLaunchCode(config)
  }

  // gen webpack config
  var entries = getEntries(config, context)
  if (Object.keys(entries).length === 0) return
  var webpackConfig = getWebpackConfig(config, context)
  webpackConfig.entry = entries

  // compiler react jsx
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
      logger.done('view ::', `[${assets.map(asset => asset.name).join(',')}]`)
    }
  })
  logger.warn('view ::', 'webpack working...')
  compiler.run(function (err, stats) {
    if (err) console.log(err)
  })
}

/**
 * write launch code
 *
 * @param  {Object} config
 */
function writeLaunchCode(config) {
  var gen = require('./view-affix/launch.js')
  var code = gen(config.holder.name, config.holder.stub)
  var output = path.join(config.static, 'launch.js')
  fs.writeFileSync(output, code, 'utf8')
  logger.done('view ::', 'launch code generated')
}

/**
 * get entries
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Object} webpack entries
 */
function getEntries(config, context) {
  var client = config.client.replace(/\/$/, '')
  var filter = config.filter && new RegExp(config.filter)
  var files = context.entries.length > 0 ?
    context.entries : glob.sync(client + '/**/index.jsx')
  files = files
    .filter(file => !/node_modules/.test(file))
    .filter(file => !filter || !filter.test(file))
    .filter(file => /index\.jsx$/.test(file))
  var entries = {}
  files.forEach(file => {
    var name = path.relative(client, file).slice(0, -4)
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
          loader: path.join(__dirname, 'view-affix/settle.js'),
          test: /\.(es6|jsx)$/,
          options: { holder: config.holder }
        },
        {
          exclude: /node_modules/,
          loader: assist.resolve('babel-loader'),
          test: /\.(es6|js|jsx)$/
        }
      ]
    },
    output: {
      path: config.static,
      filename: '[name].js'
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: config.alias || {}
    },
    externals: {
      // 对于client端，config是空白
      'config': 'var {}'
    }
  }

  var babelConfig = getBabelConfig(context.env)
  var babelLoader = webpackConfig.module.rules
    .find(rule => rule.loader && /babel/.test(rule.loader))
  babelLoader.options = babelConfig

  if (config.extern) {
    config.extern = assist.arrayify(config.extern)
    if (config.extern.indexOf('react') >= 0) {
      webpackConfig.externals['react'] = 'React'
      webpackConfig.externals['react-dom'] = 'ReactDOM'
    }
  }

  if (!webpackConfig.externals['react']) {
    webpackConfig.module.rules.push(
      { loader: 'expose-loader?React', test: require.resolve('react') },
      { loader: 'expose-loader?ReactDOM', test: require.resolve('react-dom') }
    )
  }

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
    babelrc.presets.map(preset => 'babel-preset-' + preset))
  babelrc.plugins = babelrc.plugins || []
  return babelrc
}
