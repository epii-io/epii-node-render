/* eslint-disable global-require */

const epii = require('../source');

async function main() {
  // http://localhost:port/views/index.html
  if (process.env.NODE_ENV === 'development') {
    epii.watch(require('./avatar/config'));
  } else {
    epii.build(require('./avatar/config'))
      .then(() => {
        console.log('example/avatar/scenes/index.html');
      });
  }
}

main();
