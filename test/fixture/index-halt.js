const render = require('../../source/');

const config1 = {};
const config2 = {
  path: {}
};

module.exports = async function main() {
  await render.buildOnce(config1).catch(error => console.error(error.message));
  await render.resetContext();
  await render.buildOnce(config2).catch(error => console.error(error.message));
  await render.resetContext();
};
