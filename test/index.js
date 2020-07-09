const assert = require('assert');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');

const fixtureDir = path.join(__dirname, './fixture');
const staticDir = path.join(fixtureDir, 'static');
const fileCache = {};

function assertFile(actual, expect, config) {
  if (!config) config = { mode: 'equal' };
  let actualContent = fileCache[actual];
  if (!actualContent) {
    actualContent = fs.readFileSync(actual, 'utf8');
    fileCache[actual];
  }
  let expectContent = expect;
  if (config.mode === 'equal') {
    expectContent = fs.readFileSync(expect, 'utf8');
    assert.equal(actualContent, expectContent);
  } else {
    const judge = actualContent.indexOf(expectContent) >= 0;
    if (!judge) {
      console.error('expect', expectContent);
    }
    assert(judge);
  }
}

async function readyToTest() {
  childProcess.execSync(`rm -rf ${path.join(__dirname, 'fixture/static')}`);
  await require('./fixture/index-devp.js')();
  await require('./fixture/index-prod.js')();
  await require('./fixture/index-halt.js')();
}

describe('epii-render tests', function () {
  this.timeout(30000);

  before(readyToTest);

  describe('file recipe', function () {
    it('index.html must be copied', function () {
      const path1 = path.join(staticDir, 'client-devp/1st/index.html');
      const path2 = path.join(staticDir, 'client-prod/1st/index.html');
      const pathExpect = path.join(fixtureDir, 'client/1st/index.html');
      assertFile(path1, pathExpect);
      assertFile(path2, pathExpect);
    });

    it('assets must be copied', function () {
      const path1 = path.join(staticDir, 'client-devp/assets/a.js');
      const path2 = path.join(staticDir, 'client-prod/assets/a.js');
      const pathExpect = path.join(fixtureDir, 'client/assets/a.js');
      assertFile(path1, pathExpect);
      assertFile(path2, pathExpect);
    });
  });

  describe('pure recipe', function () {
    it('compile js', function () {
      var path1 = path.join(staticDir, 'client-devp/2nd/index.js')
      var path2 = path.join(staticDir, 'client-prod/2nd/index.js')
      assertFile(path1, 'module a', { mode: 'fuzzy' })
      assertFile(path1, 'module b', { mode: 'fuzzy' })
      assertFile(path2, 'module a', { mode: 'fuzzy' })
      assertFile(path2, 'module b', { mode: 'fuzzy' })
    });

    it('copy js for simple', function () {
      const path1 = path.join(staticDir, 'client-prod-2/2nd/index.js')
      assertFile(path1, 'import moduleA', { mode: 'fuzzy' })
    });
  });

  describe('view recipe', function () {
    it('compile jsx', function () {
      var path1 = path.join(staticDir, 'client-devp/1st/index.js')
      var path2 = path.join(staticDir, 'client-prod/1st/index.js')
      assertFile(path1, '"first react view"', { mode: 'fuzzy' })
      assertFile(path1, '"header"', { mode: 'fuzzy' })
      assertFile(path1, 'settle-loader', { mode: 'fuzzy' })
      assertFile(path2, 'react.production.min.js', { mode: 'fuzzy' })
      assertFile(path2, '"first react view"', { mode: 'fuzzy' })
      assertFile(path2, 'settle-loader', { mode: 'fuzzy' })
      // why h1 not found?
    });

    it('async to generator', () => {
      const path1 = path.join(staticDir, 'client-devp/index.js');
      const path2 = path.join(staticDir, 'client-prod/index.js');
      assertFile(path1, '_asyncToGenerator(function*', { mode: 'fuzzy' });
      assertFile(path2, 'function*(){this.setState', { mode: 'fuzzy' });
    });

    it('resolve root alias', function () {
      const path1 = path.join(staticDir, 'client-devp/1st/index.js');
      assertFile(path1, 'test-guagua', { mode: 'fuzzy' });
    });

    it('export React', function () {
      const path1 = path.join(staticDir, 'client-prod/index.js');
      assertFile(path1, '___EXPOSE_LOADER_GLOBAL_THIS___["React"]', { mode: 'fuzzy' });
      assertFile(path1, '___EXPOSE_LOADER_GLOBAL_THIS___["ReactDOM"]', { mode: 'fuzzy' });
    });

    it('compile sass', function () {
      var path1 = path.join(staticDir, 'client-devp/index.css')
      assertFile(path1, '#333', { mode: 'fuzzy' })
      assertFile(path1, 'ul li a:hover', { mode: 'fuzzy' })
    });

    it('sass url prefix or relative', () => {
      const path1 = path.join(staticDir, 'client-devp/index.css')
      assertFile(path1, 'url(https://epii.io/test.png)', { mode: 'fuzzy' });
      assertFile(path1, 'url(assets/test.png)', { mode: 'fuzzy' });
      const path2 = path.join(staticDir, 'client-prod/index.css')
      assertFile(path2, 'url(https://epii.io/test.png)', { mode: 'fuzzy' });
      assertFile(path2, 'url(/__file/test.png)', { mode: 'fuzzy' });
    });

    it('launch code', function () {
      var path1 = path.join(staticDir, 'client-devp/launch.js')
      var path2 = path.join(staticDir, 'client-prod/launch.js')
      assertFile(path1, 'epii view not provided', { mode: 'fuzzy' })
      assertFile(path2, 'epii view not provided', { mode: 'fuzzy' })
    });
  });

  describe('watch files', () => {
    it('watch index.jsx', () => {
      const path1 = path.join(staticDir, 'client-devp/watch/index.js')
      assertFile(path1, '"index view for watch test"', { mode: 'fuzzy' })
    });

    after(() => {
      childProcess.execSync(`rm -rf ${path.join(__dirname, 'fixture/client/watch/index.jsx')}`);
    });
  });
});
