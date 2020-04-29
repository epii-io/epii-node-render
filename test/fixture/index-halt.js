const render = require('../../source/');

const config1 = {};
const config2 = {
  path: {}
};

module.exports = async function main() {
  await render.build(config1).catch(error => console.error(error.message));
  render.reset();
  await render.build(config2).catch(error => console.error(error.message));
  render.reset();
};
