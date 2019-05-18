const render = require('../../source/index');

const config = {
  path: {
    root: __dirname,
    client: 'client',
    static: 'static/client-devp'
  },
  filter: 'component',
  holder: {
    name: 'app',
    stub: 'epii'
  },
  extern: 'react',
  logger: true
};

render.watch(config);
