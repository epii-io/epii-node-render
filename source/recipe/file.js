const path = require('path');
const shell = require('shelljs');
const logger = require('../kernel/logger.js');

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
    .filter(file => file.startsWith(config.$render.source.assets) || /index\.([^/]+\.)*html/.test(file))
    .forEach(file => {
      const name = path.relative(config.$render.source.root, file);
      entries[name] = file;
    });
  return entries;
}

/**
 * invoke build recipe
 * for file
 *
 * @param  {Object} config
 * @param  {Object} context
 * @return {Promise}
 */
function invokeRecipe(config, context) {
  // copy entries
  const entries = getEntries(config, context);
  Object.keys(entries).forEach(name => {
    const entry = entries[name];
    if (typeof entry === 'string') {
      const source = entry;
      const target = path.join(config.$render.target.root, name);
      shell.mkdir('-p', path.dirname(target));
      shell.cp('-r', source, target);
    } else {
      const source = entry.source;
      const target = entry.target;
      shell.cp('-r', source, target);
    }
    logger.info('file ::', `[${name}] copied`);
  });
}

module.exports = invokeRecipe;
