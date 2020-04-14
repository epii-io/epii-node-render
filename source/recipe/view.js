/* global Promise */
/* eslint-disable dot-notation */

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const precss = require('precss');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const assist = require('../kernel/assist.js');
const logger = require('../kernel/logger.js');

/**
 * write launch code
 *
 * @param  {Object} config
 */
function writeLaunchCode(config) {
  const { name, stub } = config.holder;
  if (!name || !stub) {
    throw new Error('invalid name or stub');
  }
  const launchFile = path.join(__dirname, 'view.launch.txt');
  const launchCode = fs.readFileSync(launchFile, 'utf-8')
    .replace(/\$\{name\}/g, name)
    .replace(/\$\{stub\}/g, stub);
  const outputPath = path.join(config.$render.target.root, 'launch.js');
  fs.writeFileSync(outputPath, launchCode, 'utf8');
  logger.done('view ::', 'launch code written');
}

/**
 * get webpack config
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Object} result - webpack config
 */
function getWebpackConfig(config, context) {
  const webpackConfig = {
    mode: context.env,
    plugins: [
      new MiniCssExtractPlugin({
        moduleFilename: ({ name }) => name.replace(/jsx$/, 'css')
      })
    ],
    module: {
      rules: [
        {
          exclude: [/node_modules/],
          loader: assist.resolve('settle-loader'),
          test: /\.jsx$/,
          options: {
            stub: config.holder.stub,
            link: 'react-dom'
          }
        },
        {
          exclude: /node_modules/,
          loader: assist.resolve('babel-loader'),
          test: /\.jsx$/
        },
        {
          exclude: /node_modules/,
          test: /\.scss$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: assist.resolve('css-loader'),
              options: { importLoaders: 1 }
            },
            {
              loader: assist.resolve('postcss-loader'),
              options: {
                ident: 'postcss',
                plugins: () => [
                  precss()
                ]
              }
            }
          ]
        }
      ]
    },
    output: {
      path: config.$render.target.root,
      filename: (chunkData) => chunkData.chunk.name.slice(0, -1)
    },
    resolve: {
      extensions: ['.js', '.jsx']
    },
    externals: {}
  };

  // try to append exclude by filter 
  if (config.filter) {
    webpackConfig.module.rules[0].exclude.push(new RegExp(config.filter));
  }

  const babelConfig = assist.getBabelConfig(context.env);
  const babelLoader = webpackConfig.module.rules
    .find(rule => rule.loader && /babel/.test(rule.loader));
  babelLoader.options = babelConfig;

  if (config.$render.alias) {
    webpackConfig.resolve.alias = config.$render.alias;
  }

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

  // expose react if not extern react
  if (!webpackConfig.externals['react']) {
    webpackConfig.module.rules.push(
      { test: require.resolve('react'), use: [{ loader: 'expose-loader', options: 'React' }] },
      { test: require.resolve('react-dom'), use: [{ loader: 'expose-loader', options: 'ReactDOM' }] }
    );
  }

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

  // write launch code at first build
  if (context.first) {
    writeLaunchCode(config);
  }

  // generate webpack config
  const webpackConfig = getWebpackConfig(config, context);
  webpackConfig.entry = entries;

  // compiler view jsx
  logger.warn('view ::', 'webpack working...');
  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);
    compiler.hooks.done.tapAsync('EPII', stats => {
      const errors = stats.compilation.errors;
      if (errors && errors.length && config.logger) {
        errors.forEach(error => console.log(error.message));
        reject(new Error('webpack error'));
        return;
      }
      const assets = stats.toJson({ assets: true }).assets;
      assets.forEach(asset => {
        if (asset.emitted) {
          logger.done(
            'view ::',
            `[${asset.name}] => ${assist.toBigBytesUnit(asset.size)}`
          );
        } else {
          logger.halt('view ::', `[${asset.name}] => error`);
        }
      });
      resolve();
    });
    compiler.run();
  });
}

module.exports = invokeRecipe;
