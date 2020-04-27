/* global Promise */

const path = require('path');
const shell = require('shelljs');
const webpack = require('webpack');
const assist = require('../kernel/assist.js');
const logger = require('../kernel/logger.js');

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
      path: config.$render.target.root,
      filename: '[name]'
    },
    resolve: {
      extensions: ['.js']
    }
  };

  const babelConfig = assist.getBabelConfig();
  const babelLoader = webpackConfig.module.rules
    .find(rule => rule.loader && /babel/.test(rule.loader));
  babelLoader.options = babelConfig;

  if (config.$render.alias) {
    webpackConfig.resolve.alias = config.$render.alias;
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
    .filter(file => {
      return !file.startsWith(config.$render.source.assets)
        && file.endsWith('index.js');
    })
    .forEach(file => {
      const name = path.relative(config.$render.source.root, file);
      entries[name] = file;
    });
  return entries;
}

/**
 * invoke build recipe
 * for pure js
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

  if (config.simple) {
    // copy entries
    Object.keys(entries).forEach(entry => {
      const source = entries[entry];
      const target = path.join(config.$path.target.client, entry);
      shell.mkdir('-p', path.dirname(target));
      shell.cp(source, target);
      logger.info('pure ::', `copy ${entry}`);
    });
    logger.warn('pure ::', 'pass simple scripts');
    return Promise.resolve();
  }

  // generate webpack config
  const webpackConfig = getWebpackConfig(config, context);
  webpackConfig.entry = entries;

  // compiler pure js
  logger.warn('pure ::', 'webpack working...');
  return new Promise((resolve, reject) => {
    const compiler = webpack(webpackConfig);
    compiler.hooks.done.tapAsync('EPII', stats => {
      const errors = stats.compilation.errors;
      if (errors && errors.length && config.logger) {
        errors.forEach(error => console.log(assist.hideErrorStack(error.message)));
        reject(new Error('webpack error'));
        return;
      }
      const assets = stats.toJson({ assets: true }).assets;
      assets.forEach(asset => {
        if (asset.emitted) {
          logger.done(
            'pure ::',
            `[${asset.name}] => ${assist.toBigBytesUnit(asset.size)}`
          );
        } else {
          logger.halt('pure ::', `[${asset.name}] => error`);
        }
      });
      resolve();
    });
    compiler.run();
  });
}

module.exports = invokeRecipe;
