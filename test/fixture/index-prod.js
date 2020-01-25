const render = require('../../source/index');

const config = {
  path: {
    root: __dirname,
    client: 'client',
    static: 'static/client-prod'
  },
  filter: 'component',
  logger: true,
  expert: {
    'skip-clean': true
  }
};

render.build(config);

