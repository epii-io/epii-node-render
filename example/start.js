/* eslint-disable global-require */

const epiiRender = require('../source');

async function main() {
  // http://localhost:port/views/index.html
  if (process.env.NODE_ENV === 'development') {
    epiiRender.watchBuild(require('./avatar/config'));
  } else {
    epiiRender.buildOnce(require('./avatar/config'))
      .then(() => {
        console.log('example/avatar/static/scenes/index.html');
      });
  }
}

main();
