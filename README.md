# epii-render
###### `epii-node-render`

[![Build Status](https://travis-ci.org/epii-io/epii-node-render.svg?branch=master)](https://travis-ci.org/epii-io/epii-node-render)
[![Coverage Status](https://coveralls.io/repos/github/epii-io/epii-node-render/badge.svg?branch=master)](https://coveralls.io/github/epii-io/epii-node-render?branch=master)

a simple builder for React + SASS  

- Webpack + Babel + React
- PostCSS + PreCSS

`EPII render` is designed for `EPII server` project.
You can customize view container name and `window` namespace to place model & view.

## Features

### build React views
- compile `source/**[not assets]/*.jsx` to `target`
- auto assign view into global namespace 
- auto output launch script
- optional using extern react

### build other JS
- compile `source/**[not assets]/*.js` to `target`
- or only copy `source/**[not assets]/*.js` to `target` (simple mode)

### build SASS
- compile `source/**[not assets]/*.scss` as SASS to `target`

### build raw files
- auto copy `source/assets/*.*` to `target/assets`
- auto copy `source/**[not assets]/index.*[not jsx/js/scss/css]` to `target`

### hot reload
- auto watch all files changes

## Usage

### project like this

```sh
(root)
├── target
└── source
    ├── scenes
    │   ├── component (skip)
    │   ├── SceneA
    │   │   ├── component (skip)
    │   │   ├── index.jsx
    │   │   └── index.scss
    │   ├── SceneB
    │   │   ├── index.js
    │   │   └── index.html
    │   ├── index.jsx
    │   └── index.scss
    └── assets
        ├── image.png
        ├── video.mp4
        └── octet.bin
```

### install as dev dependency
```sh
npm install --save-dev epii-render@latest
```

### use api to build or watch
```js
const epiiRender = require('epii-render')

const config = {
  path: {
    root: __dirname,
    client: 'your-source-dir', // or source
    static: 'your-target-dir', // or target
  },
  filter: 'component', // skip client/**/component/*
  holder: {
    name: 'app',  // view container name, name='app' means div#app
    stub: 'epii', // window namespace, stub='epii' means window.epii.view = React view
  },
  extern: 'react', // use external react library (from CDN),
  simple: true, // default false
  logger: true, // default true
}

// build once with production env
epiiRender.build(config)

// build & watch with development env
epiiRender.watch(config)
```
