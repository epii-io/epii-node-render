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
    stub: 'epii'
  },
  extern: 'react',
  logger: true,
  expert: {
    'skip-clean': true
  }
};

function copyFile() {
  const source = path.join(__dirname, 'watch.jsx');
  const target = path.join(__dirname, 'client/watch/index.jsx');
  fs.copyFileSync(source, target);
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('trigger watch by copy file');
      resolve();
    }, 3000);
  });
}

module.exports = async function main() {
  await render.watch(config);
  await copyFile();
  await render.reset();
};
