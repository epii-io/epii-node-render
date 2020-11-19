/* global Promise */
/* eslint-disable dot-notation */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const assist = require('../kernel/assist.js');
const logger = require('../kernel/logger.js');

const logPrefix = 'view ::';

/**
 * get webpack config
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Object} result - webpack config
 */
function getWebpackConfig(config, context) {
  const babelConfig = assist.getBabelConfig(context.env);
  const webpackConfig = {
    mode: context.env,
    plugins: [
      new MiniCssExtractPlugin({
        filename: (pathData) => pathData.chunk.name.replace('.jsx', '.css')
      })
    ],
    module: {
      rules: [
        {
          exclude: [/node_modules/],
          test: /\.jsx$/,
          loader: assist.resolve('babel-loader'),
          options: babelConfig
        },
        {
          exclude: [/node_modules/],
          test: /index\.jsx$/,
          loader: assist.resolve('launch-loader'),
          options: config.launch
        },
        {
          exclude: [/node_modules/],
          test: /\.scss$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {}
            },
            {
              loader: assist.resolve('css-loader'),
              options: {
                importLoaders: 1,
                url: false
              }
            },
            {
              loader: assist.resolve('postcss-loader'),
              options: {
                postcssOptions: {
                  plugins: [
                    require('precss')(),
                    require('postcss-url')({
                      url: asset => {
                        // skip absolute url
                        if (assist.isAbsoluteURL(asset.url)) {
                          return asset.url;
                        }
                        // auto add static prefix
                        if (config.static && config.static.prefix) {
                          return path.join(config.static.prefix, asset.url);
                        }
                        // auto relative to asset
                        const rel = path.relative(path.dirname(asset.absolutePath), config.$render.source.assets);
                        return path.join(rel, asset.url);
                      }
                    })
                  ]  
                }
              }
            },
          ]
        }
      ]
    },
    output: {
      path: config.$render.target.root,
      filename: (chunkData) => chunkData.chunk.name.slice(0, -1)
    },
    resolve: {
      alias: { '~': config.$render.source.root },
      extensions: ['.js', '.jsx']
    },
    externals: {}
  };

  // try to append exclude by filter 
  if (config.filter) {
    webpackConfig.module.rules[1].exclude.push(new RegExp(config.filter));
  }

  // using external library
  if (config.extern) {
    if (config.extern.indexOf('react') >= 0) {
      webpackConfig.externals['react'] = 'React';
      webpackConfig.externals['react-dom'] = 'ReactDOM';
    }
    if (config.extern.indexOf('antd') >= 0) {
      webpackConfig.externals['antd'] = 'antd';
      webpackConfig.externals['moment'] = 'moment';
    }
  }

  // configure devtool
  if (context.env === 'development') {
    webpackConfig.devtool = 'source-map';
  }
  return webpackConfig;
}

/**
 * get entries
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Object} webpack entries
 */
function getEntries(config, context) {
  const entries = {};
  context.entries
    .filter(file => !file.startsWith(config.$render.source.assets)
      && file.endsWith('index.jsx'))
    .forEach(file => {
      const name = path.relative(config.$render.source.root, file);
      entries[name] = file;
    });
  return entries;
}

/**
 * invoke build recipe
 * for view jsx + scss
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Promise}
 */
function invokeRecipe(config, context) {
  const entries = getEntries(config, context);
  if (Object.keys(entries).length === 0) {
    return Promise.resolve();
  }

  // generate webpack config
  const webpackConfig = getWebpackConfig(config, context);
  webpackConfig.entry = entries;

  // compiler view jsx
  logger.warn(logPrefix, 'webpack working...');
  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);
    compiler.hooks.done.tapAsync('epii', stats => {
      const errors = stats.compilation.errors;
      if (errors && errors.length) {
        errors.forEach(error => {
          console.log(assist.hideErrorStack(error.message));
        });
        reject(new Error('webpack error'));
        return;
      }
      const assets = stats.toJson({ assets: true }).assets;
      assets.forEach(asset => {
        if (asset.emitted) {
          logger.done(logPrefix, `[${asset.name}] => ${assist.toBigBytesUnit(asset.size)}`);
        }
        // what about else ?
      });
      resolve();
    });
    compiler.run();
  });
}

module.exports = invokeRecipe;
