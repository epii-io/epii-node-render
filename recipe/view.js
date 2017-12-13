'use strict'

const fs = require('fs')
const path = require('path')
const glob = require('glob')
const webpack = require('webpack')
const assist = require('../kernel/assist.js')
const logger = require('../kernel/logger.js')

module.exports = function (config, context) {
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
  compiler.run(function (error, stats) {
    if (error) console.log(error)
  })
}

/**
 * write launch code
 *
 * @param  {Object} config
 */
function writeLaunchCode(config) {
  var { name, stub } = config.holder
  if (!name || !stub) {
    throw new Error('invalid name or stub')
  }
  var code = `
    ;(function () {
      var root = document.getElementById('${name}');
      if (!root) throw new Error('undefined ${stub} root');
      var view = window.${stub}.entry;
      if (!view) throw new Error('undefined ${stub} view');
      ReactDOM.render(React.createElement(view), root);
    }());
  `.replace(/\n|(\s{2})/g, '')
  var output = path.join(config.$path.target.client, 'launch.js')
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
  var filter = config.filter && new RegExp(config.filter)
  var files = context.entries.length > 0
    ? context.entries
    : glob.sync(config.$path.source.client + '/**/index.jsx')
  files = files
    .filter(file => !/node_modules/.test(file))
    .filter(file => !filter || !filter.test(file))
    .filter(file => /index\.jsx$/.test(file))
  var entries = {}
  files.forEach(file => {
    var name = path.relative(config.$path.source.client, file).slice(0, -4)
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
          loader: assist.resolve('settle-loader'),
          test: /\.(es6|jsx)$/,
          options: {
            stub: config.holder.stub,
            link: 'react-dom'
          }
        },
        {
          exclude: /node_modules/,
          loader: assist.resolve('babel-loader'),
          test: /\.(es6|js|jsx)$/
        }
      ]
    },
    output: {
      path: config.$path.target.client,
      filename: '[name].js'
    },
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: config.alias || {}
    },
    externals: {}
  }

  var babelConfig = assist.getBabelConfig(context.env)
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
    webpackConfig.module.rules.push({
      test: require.resolve('react'),
      use: [{ loader: 'expose-loader', options: 'React' }]
    },{
      test: require.resolve('react-dom'),
      use: [{ loader: 'expose-loader', options: 'ReactDOM' }]
    })
  }

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
