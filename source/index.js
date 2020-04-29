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
    return logger.halt('empty config.path');
  }
  if (!config.path.root) {
    return logger.halt('empty config.path.root');
  }
  if (!config.path.source && !config.path.client) {
    logger.warn('empty config.path.source, use "client" by default');
    config.path.source = 'client';
  }
  if (!config.path.target && !config.path.static) {
    logger.warn('empty config.path.target, use "static" by default');
    config.path.target = 'static';
  }
  if (config.filter && typeof config.filter !== 'string') {
    return logger.halt('config.filter should be only string');
  }
  if (!config.filter) {
    logger.warn('empty config.path.filter, use "component" by default');
    config.filter = 'component';
  }
  if (!config.holder) {
    logger.warn('empty config.holder, use { name: "app", stub: "epii" } by default');
    config.holder = { name: 'app', stub: 'epii' };
  }
  if (!config.static) {
    config.static = {};
  }
  if (config.static.prefix) {
    if (!assist.isAbsoluteURL(config.static.prefix)) {
      logger.warn('config.static.prefix is relative, rewrited to absolute');
      config.static.prefix = '/' + config.static.prefix;
    }
  }
  if (config.extern) {
    config.extern = assist.arrayify(config.extern);
  }
  if (!config.expert) {
    config.expert = {};
  }
  const sourceDir = path.join(config.path.root, config.path.source || config.path.client).replace(/\/$/, '');
  const targetDir = path.join(config.path.root, config.path.target || config.path.static).replace(/\/$/, '');
  config.$render = {
    source: {
      root: sourceDir,
      assets: path.join(sourceDir, 'assets')
    },
    target: {
      root: targetDir,
      assets: path.join(targetDir, 'assets')
    }
  };
  config.$logger = {
    verbose: process.env.EPII_VERBOSE === 'true'
  };
  if (config.$logger.verbose && CONTEXT.first) {
    logger.info(config);
  }
  return config;
}

/**
 * build once, default production
 *
 * @param  {Object} config
 * @return {Promise}
 */
async function buildOnce(config) {
  console.log('\n');

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
      logger.warn(`target [${config.$render.target.root}] clean`);
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
  ])
    .catch(error => {
      if (config.$logger.verbose) {
        logger.halt(error);
      } else {
        logger.halt('build error');
      }  
    });

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
  let timeout;
  const watcher = assist.tryWatch(
    config.$render.source.root,
    (e, file) => {
      logger.warn('watch', e, file);
      if (!file || !/\./.test(file)) return;
      const relFile = path.relative(config.$render.source.root, file);
      if (config.$logger.verbose) {
        logger.warn('watch', e, relFile);
      }
      watcher.busy = true;
      clearTimeout(timeout);
      if (e === 'add' || e === 'change') {
        CONTEXT.entries.push(file);
      } else {
        CONTEXT.entries.splice(CONTEXT.entries.indexOf(file), 1);
      }
      timeout = setTimeout(() => {
        CONTEXT.entries = finder.getRelatedEntries(config, CONTEXT.entries);
        if (CONTEXT.entries.length === 0) return;
        logger.warn(`build ${CONTEXT.entries.length} file(s) in queue`);
        buildOnce(config, CONTEXT).then(() => {
          watcher.busy = false;
        });
      }, 1000);
    }
  );
  watcher.busy = false;
  CONTEXT.watcher = watcher;
}

/**
 * reset build context
 */
async function resetContext() {
  CONTEXT.env = 'production';
  CONTEXT.first = true;
  CONTEXT.entries = [];
  // todo - kill watcher
  if (CONTEXT.watcher) {
    await assist.stopWatch(CONTEXT.watcher);
    CONTEXT.watcher = null;
  }
}

module.exports = {
  build: buildOnce,
  watch: watchBuild,
  reset: resetContext
};
