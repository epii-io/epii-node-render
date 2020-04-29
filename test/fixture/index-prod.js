const render = require('../../source/');

const config1 = {
  path: {
    root: __dirname,
    target: 'static/client-prod'
  },
  static: {
    prefix: '__file'
  },
  expert: {
    'skip-clean': true
  }
};

const config2 = {
  path: {
    root: __dirname,
    target: 'static/client-prod-2'
  },
  static: {
    prefix: '__file'
  },
  simple: true,
  expert: {
    'skip-clean': true
  }
};

module.exports = async function main() {
  await render.build(config1);
  render.reset();
  await render.build(config2);
  render.reset();
};
