/* global Promise */

const path = require('path');
const shell = require('shelljs');
const assist = require('./kernel/assist.js');
const logger = require('./kernel/logger.js');
const finder = require('./finder.js');
const pureRecipe = require('./recipe/pure.js');
const viewRecipe = require('./recipe/view.js');
const fileRecipe = require('./recipe/file.js');

const CONTEXT = {
  env: 'production',
  first: true,
  entries: []
};

/**
 * guard config
 *
 * @param  {Object} config
 * @return {Object}
 */
function lintConfig(config) {
  if (!config.path) {
    return logger.halt('null config.path');
  }
  if (!config.path.root) {
    return logger.halt('null config.path.root');
  }
  if (!config.path.source && !config.path.client) {
    return logger.halt('null config.path.source');
  }
  if (!config.path.target && !config.path.static) {
    return logger.halt('null config.path.target');
  }
  if (config.filter && typeof config.filter !== 'string') {
    return logger.halt('config.filter can be only string');
  }
  const newConfig = config;
  if (!config.holder) {
    newConfig.holder = { name: 'app', stub: 'epii' };
  }
  if (!config.prefix) {
    newConfig.prefix = { static: '/__file' };
  }
  if (!config.expert) {
    newConfig.expert = {};
  }
  if (!config.logger) {
    newConfig.logger = true;
  }
  if (config.extern) {
    newConfig.extern = assist.arrayify(config.extern);
  }
  const sourceRoot = path.join(
    config.path.root,
    config.path.source || config.path.client || ''
  ).replace(/\/$/, '');
  const targetRoot = path.join(
    config.path.root,
    config.path.target || config.path.static || ''
  ).replace(/\/$/, '');
  newConfig.$render = {
    source: {
      root: sourceRoot,
      assets: path.join(sourceRoot, 'assets')
    },
    target: {
      root: targetRoot,
      assets: path.join(targetRoot, 'assets')
    }
  };
  newConfig.$logger = {
    verbose: process.env.EPII_VERBOSE === 'true'
  };
  if (newConfig.$logger.verbose && CONTEXT.first) {
    logger.info(config);
  }
  return newConfig;
}

/**
 * build once, default production
 *
 * @param  {Object} config
 * @return {Promise}
 */
async function buildOnce(config) {
  // verify config
  if (!lintConfig(config)) {
    throw new Error('invalid config');
  }

  if (CONTEXT.first) {
    // remove target dir
    if (
      !config.expert['skip-clean']
      && config.$render.target.root.length > 5
    ) {
      shell.rm('-rf', config.$render.target.root);
    } else {
      // maybe path is / or ~ or /root
      logger.warn('target path too short to auto clean');
    }
    // create target dir
    shell.mkdir('-p', config.$render.target.assets);
    // get initial entries
    CONTEXT.entries = finder.getInitialEntries(config);
  }

  // invoke source recipes
  await Promise.all([
    pureRecipe(config, CONTEXT),
    viewRecipe(config, CONTEXT),
    fileRecipe(config, CONTEXT)
  ]);

  // reset context
  CONTEXT.first = false;
  CONTEXT.entries = [];
}

/**
 * watch & build, development
 */
async function watchBuild(config) {
  // set development env
  CONTEXT.env = 'development';

  // build once immediately
  await buildOnce(config);

  // bind watch handler
  return assist.tryWatch(
    config.$render.source.root,
    (e, file) => {
      if (!file || !/\./.test(file)) return;
      const relFile = path.relative(config.$render.source.root, file);
      if (config.$logger.verbose) {
        logger.warn('watch', e, relFile);
      }
      let timeout = -1;
      clearTimeout(timeout);
      if (e === 'add' || e === 'change') {
        CONTEXT.entries.push(file);
      } else {
        // todo - remove unlink files
        CONTEXT.entries.splice(CONTEXT.entries.indexOf(file), 1);
      }
      timeout = setTimeout(() => {
        CONTEXT.entries = finder.getRelatedEntries(config, CONTEXT.entries);
        if (CONTEXT.entries.length === 0) return;
        logger.warn(`build ${CONTEXT.entries.length} file(s) in watch queue`);
        buildOnce(config, CONTEXT);
      }, 1000);
    }
  );
}

module.exports = {
  build: buildOnce,
  watch: watchBuild
};
