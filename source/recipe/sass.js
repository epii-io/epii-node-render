const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const postcss = require('postcss');
const precss = require('precss');
const logger = require('../kernel/logger.js');

/**
 * get entries
 *
 * @param  {Object} config
 * @return {Object} webpack entries
 */
function getEntries(config, context) {
  const entries = {};
  context.entries
    .filter(file =>
      !file.startsWith(config.$render.source.assets)
      && file.endsWith('index.scss'))
    .forEach(file => {
      const name = path.relative(config.$render.source.root, file);
      entries[name] = file;
    });
  return entries;
}

module.exports = (config, context) => {
  // ctor postcss + precss processor
  const processor = postcss().use(precss);

  // process entries
  const entries = getEntries(config, context);
  Object.keys(entries).forEach((entry) => {
    const source = entries[entry];
    const target = path.join(
      config.$render.target.root,
      entry.replace(/\.scss$/, '.css')
    );
    shell.mkdir('-p', path.dirname(target));

    const content = fs.readFileSync(source, 'utf8');
    processor.process(content, { from: source, to: target })
      .then(result => {
        fs.writeFileSync(target, result.css, 'utf8');
        logger.done('sass ::', `[${entry}] => done`);
      })
      .catch(error => {
        logger.halt('sass ::', `[${entry}] => error`);
        console.log(error.message);
      });
  });
};
