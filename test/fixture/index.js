const path = require('path')
const render = require('../../')

var config1 = {
  path: {
    root: __dirname,
    client: 'client',
    static: 'static/client-prod',
    vendor: 'vendor'
  },
  filter: 'component',
  logger: true
}

var config2 = {
  path: {
    root: __dirname,
    client: 'client',
    static: 'static/client-devp',
    vendor: 'vendor'
  },
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
