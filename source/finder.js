const glob = require('glob');
const logger = require('./kernel/logger');

const CONTEXT = {
  entries: []
};

/**
 * include entry
 *
 * @param  {String} entry
 * @return {String}
 */
function includeEntry(entry) {
  return !/node_modules/.test(entry);
}

function getRelatedEntries(config, entries) {
  const nextEntries = [];
  entries.forEach(inputEntry => {
    if (!includeEntry(inputEntry)) return;
    const filterStart = inputEntry.indexOf(config.filter);
    if (filterStart < 0) {
      nextEntries.push(inputEntry);
      if (!CONTEXT.entries.includes(inputEntry)) {
        CONTEXT.entries.push(inputEntry);
      }
    } else {
      const startPart = inputEntry.slice(0, filterStart);
      CONTEXT.entries.forEach((existEntry) => {
        if (
          existEntry.startsWith(startPart)
          && !nextEntries.includes(existEntry)
        ) {
          nextEntries.push(existEntry);
        }
      });
    }
  });
  console.log(nextEntries);
  return nextEntries;
}

/**
 * get initial entries
 *
 * @param  {Object} config
 * @return {String[]}
 */
function getInitialEntries(config) {
  const globDir = `${config.$render.source.root}/**/*.*`;
  const entries = glob.sync(globDir)
    .filter(includeEntry)
    .filter(e => e.indexOf(config.filter) < 0);
  if (config.$logger.verbose) {
    logger.info(globDir, entries);
  }
  CONTEXT.entries = entries;
  return entries;
}

module.exports = {
  getInitialEntries,
  getRelatedEntries
};
