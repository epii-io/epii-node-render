/* eslint-disable global-require */

const epii = require('./source/');

// http://localhost:port/views/index.html
if (process.env.NODE_ENV === 'development') {
  epii.watch(require('./example/avatar/config'));
} else {
  epii.build(require('./example/avatar/config'))
    .then(() => {
      console.log('example/avatar/scenes/index.html');
    });
}
