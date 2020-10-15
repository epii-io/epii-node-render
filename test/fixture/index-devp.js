const fs = require('fs');
const path = require('path');
const render = require('../../source/');

const config = {
  path: {
    root: __dirname,
    source: 'client',
    target: 'static/client-devp'
  },
  filter: 'component',
  holder: {
    name: 'app',
    stub: 'epii.entry'
  },
  extern: 'react',
  logger: true,
  expert: {
    'skip-clean': true
  }
};

function copyFileForWatch(watcher) {
  const source = path.join(__dirname, 'watch.jsx');
  const target = path.join(__dirname, 'client/watch/index.jsx');
  return new Promise((resolve) => {
    watcher.on('all', () => {
      setTimeout(() => resolve(), 2000);
    });
    fs.copyFileSync(source, target);
  });
}

module.exports = async function main() {
  const watcher = await render.watch(config);
  await copyFileForWatch(watcher);
  await render.reset();
};
