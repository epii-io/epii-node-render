# epii-render
###### `epii-node-render`

[![Build Status](https://travis-ci.org/epii-io/epii-node-render.svg?branch=master)](https://travis-ci.org/epii-io/epii-node-render)
[![Coverage Status](https://coveralls.io/repos/github/epii-io/epii-node-render/badge.svg?branch=master)](https://coveralls.io/github/epii-io/epii-node-render?branch=master)

a simple builder for React + SASS  

- Webpack + Babel + React
- PostCSS + PreCSS

#### CAUTION
`EPII render` is fit for `EPII server` because of settle + launch design.
You can use custom container name in your own page.
Also you can use custom namespace to place model & view in `window`.

## Features

### using React
- auto insert settle code  
- auto insert launch code
- support simple watch
- support extern react

### using other JS
- apply babel for ES6+
- apply webpack for require
- or just copy to static (simple mode)

### using SASS
- quick SASS compile

### copy raw file
- auto copy vendor into static
- auto copy other files as \*\*/index.* into static

## Usage

### project like this

```sh
(root)
├── vendor
└── client
    ├── ViewA
    │   ├── component (skip)
    │   ├── ViewA1
    │   │   ├── index.jsx
    │   │   └── index.scss
    │   ├── index.jsx
    │   └── index.scss
    └── ViewB
        ├── index.js
        ├── index.html
        └── index.scss
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
    client: 'your-source-dir',
    vendor: 'your-vendor-dir',
    static: 'your-output-dir'
  },
  filter: 'component', // skip client/**/component/*
  holder: {
    name: 'app', // container name, name='app' > div#app
    stub: 'epii' // variable stub, stub='epii' > window.epii.view = React view
  },
  extern: 'react', // external react library (from CDN),
  simple: true, // default false, means using webpack + babel for js
  logger: true
}

// build once with production env
epiiRender.build(config)

// build & watch with development env
epiiRender.watch(config)
```
