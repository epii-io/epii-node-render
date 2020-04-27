# epii-render

[![Build Status](https://travis-ci.org/epiijs/epii-render.svg?branch=master)](https://travis-ci.org/epiijs/epii-render)
[![Coverage Status](https://coveralls.io/repos/github/epiijs/epii-render/badge.svg?branch=master)](https://coveralls.io/github/epiijs/epii-render?branch=master)

a simple builder for React + SASS  

- Webpack + Babel + React
- PostCSS + PreCSS

`epii render` is designed for `epii server` project.
You can customize view container name and `window` namespace to place model & view.

## Features

### build React views
- compile `source/**[not assets]/*.jsx` to `target`
- auto assign view into global namespace 
- auto output launch script
- optional using extern react
- root alias ~ like `import '~/sth'` instead of `import '../../sth'`

### build other JS
- compile `source/**[not assets]/*.js` to `target`
- or only copy `source/**[not assets]/*.js` to `target` (simple mode)

### build SASS
- compile `source/**[not assets]/*.scss` as SASS to `target`
- auto edit assets URL by adding file server path prefix

### build raw files
- auto copy `source/assets/*.*` to `target/assets`
- auto copy `source/**[not assets]/index.*[not jsx/js/scss/css]` to `target`

### hot build
- auto watch all files changes
- auto raise related files changes

## Usage

### project like this

```sh
(root)
├── target
└── source
    ├── scenes
    │   ├── component (not entries)
    │   ├── SceneA
    │   │   ├── component (not entries)
    │   │   ├── index.jsx
    │   │   └── index.scss
    │   └── SceneB
    │       ├── index.js
    │       └── index.html
    └── assets
        ├── image.png
        ├── video.mp4
        └── octet.bin

# do NOT place assets out of [assets] directory
```

### install as dev dependency
```sh
npm install --save-dev @epiijs/render@latest
```

### use api to build or watch
```js
const epiiRender = require('@epiijs/render')

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
  static: {
    prefix: '__file', // assets/any.png <=> /__file/any.png
  },
  extern: 'react', // use external react library (from CDN),
  simple: true, // default false
  logger: true, // default true
  expert: {
    'skip-clean': false // default false
  },
}

// build once with production env
epiiRender.build(config)

// build & watch with development env
epiiRender.watch(config)
```
