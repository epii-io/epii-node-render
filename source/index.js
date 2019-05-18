const glob = require('glob');
const path = require('path');
const shell = require('shelljs');
const assist = require('./kernel/assist.js');
const logger = require('./kernel/logger.js');
const pureRecipe = require('./recipe/pure.js');
const viewRecipe = require('./recipe/view.js');
const sassRecipe = require('./recipe/sass.js');
const fileRecipe = require('./recipe/file.js');

const CONTEXT = {
  env: 'production',
  verbose: process.env.EPII_VERBOSE === 'true',
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
  const newConfig = config;
  if (!config.holder) {
    newConfig.holder = { name: 'app', stub: 'epii' };
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
  if (CONTEXT.verbose && CONTEXT.first) {
    logger.info(config);
  }
  return newConfig;
}

/**
 * get initial entries
 *
 * @param  {Object} config
 * @return {String[]}
 */
function getEntries(config) {
  const filter = config.filter && new RegExp(config.filter);
  const globDir = `${config.$render.source.root}/**`;
  const entries = glob.sync(globDir)
    .filter(file => !/node_modules/.test(file))
    .filter(file => !filter || !filter.test(file));
  if (CONTEXT.verbose) {
    logger.info(globDir, entries);
  }
  return entries;
}

/**
 * build once, default production
 */
function buildOnce(config) {
  // verify config
  if (!lintConfig(config)) throw new Error('invalid config');

  if (CONTEXT.first) {
    // remove target dir
    if (config.$render.target.root.length > 5) {
      shell.rm('-rf', config.$render.target.root);
    } else {
      // maybe path is / or ~ or /root
      logger.warn('target path too short to auto clean');
    }

    // create target dir
    shell.mkdir('-p', config.$render.target.assets);

    // get initial entries
    CONTEXT.entries = getEntries(config);
  }

  // invoke source recipes
  pureRecipe(config, CONTEXT);
  viewRecipe(config, CONTEXT);
  sassRecipe(config, CONTEXT);
  fileRecipe(config, CONTEXT);

  CONTEXT.first = false;
}

/**
 * watch & build, development
 */
function watchBuild(config) {
  // set development env
  CONTEXT.env = 'development';

  // build once immediately
  buildOnce(config);

  // bind watch handler
  // todo - build queue
  assist.tryWatch(
    config.$render.source.root,
    (e, file) => {
      if (!file) return;
      if (CONTEXT.verbose) {
        logger.warn('watch event', e, file);
      }
      CONTEXT.entries = [];
      if (e === 'add' || e === 'change') {
        CONTEXT.entries.push(file);
        buildOnce(config, CONTEXT);
      }
      // todo - support unlink
    }
  );
}

module.exports = {
  build: buildOnce,
  watch: watchBuild
};
