const path = require('path')
const render = require('../../')

var config1 = {
  client: path.join(__dirname, 'client'),
  static: path.join(__dirname, 'static/client-prod'),
  vendor: path.join(__dirname, 'vendor'),
  filter: 'component',
  logger: true
}

var config2 = {
  client: path.join(__dirname, 'client'),
  static: path.join(__dirname, 'static/client-devp'),
  filter: 'component',
  holder: {
    name: 'app',
    stub: 'epii'
  },
  extern: 'react',
  logger: true
}

render.build(config1)
render.watch(config2)
