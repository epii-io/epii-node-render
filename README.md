# epii-render

[![Build Status](https://travis-ci.org/epiijs/epii-render.svg?branch=master)](https://travis-ci.org/epiijs/epii-render)
[![Coverage Status](https://coveralls.io/repos/github/epiijs/epii-render/badge.svg?branch=master)](https://coveralls.io/github/epiijs/epii-render?branch=master)

A typical recipe for building web application using React + SASS.  

## Getting Started

A web application is a bundle of several components, contains one or more entry pages which are also components. `React` is an excellent well-designed component-based user interfaces library using `JSX` as language. `SASS` is a powerful style language. `React` and `SASS` is one of the most productive ways to develop modern user interfaces.

`epii` is a simple convention-over-configuration web application framework. `epii render` is the build tool chain of `epii`, it can compile `React` components with `SASS` styles and other assets, output best practice product running in browser.  

## Convention

```
(root)
├── source
│   ├── scenes
│   │   ├── component
│   │   ├── SceneA
│   │   │   ├── component
│   │   │   ├── index.jsx
│   │   │   └── index.scss
│   │   └── SceneB
│   │       ├── index.js
│   │       └── index.html
│   └── assets
│       ├── image.png
│       ├── video.mp4
│       └── octet.bin
└── target
    ├── scenes
    │   ├── launch.js
    │   ├── SceneA
    │   │   ├── index.js
    │   │   └── index.css
    │   └── SceneB
    │       ├── index.js
    │       └── index.html
    └── assets
        ├── image.png
        ├── video.mp4
        └── octet.bin
```

Components fall into two types, page and part of page.  
`epii-render` can discover `index.jsx` as page components as build entries.

## Features

### build React JSX
- build `source/*.jsx` to `target/*.js`
- export page component into `window` namespace by `window.epii.entry = page`
- output launch script with `ReactDOM.render`
- optionally apply external runtime like `cdn/react.js`
- use alias `~/` for source root, e.g. `import '~/sth'` instead of `import '../sth'`
- support new ES, such as `async/await` (`@decorator` not ready)

### build other JS
- compile `source/*.js` to `target/*.js`
- or only copy `source/*.js` to `target/*.js` (simple mode)

### build SASS
- build `source/*.scss` as SASS to `target/*.css`
- rewrite assets URL by adding file server path prefix, such as `url(a.png)` can be rewrite to `url(/__file/a.png)`

### build raw files
- copy `source/assets/*.*` to `target/assets/*.*`
- copy `source/index.html` to `target/index.html`

### hot build
- watch all files changes and auto build
- auto raise related files change events

## Usage

### install as dev dependency
```sh
npm install --save-dev @epiijs/render@latest
```

### use API to build or watch
```js
const epiiRender = require('@epiijs/render');

let config = {
  path: {
    root: __dirname,
    source: 'your-source-dir', // or client
    target: 'your-target-dir', // or static
  },
  filter: 'component', // skip client/**/component/*, default 'component'
  holder: {
    name: 'app',  // page container name, 'app' means 'div#app'
    stub: 'epii', // window namespace, 'epii' means 'window.epii.entry = page'
  },
  static: {
    prefix: '__file', // target/assets/any.png <=> /__file/any.png
  },
  extern: 'react', // use external React library (from CDN)
  simple: false, // default false
  expert: {
    'skip-clean': false // default false
  },
};

// less configuation
config = {
  path: {
    root: __dirname
  },
  extern: 'react'
};

// build once with production env
epiiRender.build(config);

// build & watch with development env
epiiRender.watch(config);

// build & watch return promise
// sugar for await
```
