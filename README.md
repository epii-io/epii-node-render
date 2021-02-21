# epii-render

[![Build Status](https://travis-ci.org/epiijs/epii-render.svg?branch=master)](https://travis-ci.org/epiijs/epii-render)
[![Coverage Status](https://coveralls.io/repos/github/epiijs/epii-render/badge.svg?branch=master)](https://coveralls.io/github/epiijs/epii-render?branch=master)

A typical recipe for building web application using React + SASS.  

## Getting Started

A web application is a bundle of several components, contains one or more entry pages which are also components. `React` is an excellent well-designed component-based user interfaces library using `JSX` language. `SASS` is a powerful style language. Using `React` and `SASS` may be one of the most productive ways to develop modern web application.

`epii` is a simple convention-over-configuration web application framework. `epii render` is the build tool of `epii`, it can compile `React` components with `SASS` styles and other assets, output best practice static files running in browser.  

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
`epii-render` will discover `index.jsx` as page components to build.

### how to run output

You can create a shell HTML like the following one.

```html
<!DOCTYPE html>
<html>
  <head>
  </head>
  <body>
    <div id="your-holder-name"></div>
    <!-- use CDN library to reduce load time -->
    <script src="react.js"></script>
    <script src="react-dom.js"></script>
    <!-- load output -->
    <script src="index.js"></script>
  </body>
</html>
```

Then open browser and visit the HTML. Also you can host these output files on cloud servers.

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
- copy `source/index.(*.)html` to `target/index.(*.)html`

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
  launch: {
    holder: 'app',  // holder container, 'app' means 'div#app'
    global: 'epii.entry', // global namespace, 'epii.entry' means 'window.epii.entry = page'
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
epiiRender.buildOnce(config).then(() => {
  console.log('buildOnce done');
});

// build & watch with development env
epiiRender.watchBuild(config).then((watcher) => {
  console.log('buildOnce done', 'return watcher', watcher);
});
```
