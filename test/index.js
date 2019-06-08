const assert = require('assert');
const fs = require('fs');
const path = require('path');

var fixtureDir = path.join(__dirname, './fixture')
var staticDir = path.join(fixtureDir, 'static')
var fileCache = {}

function assertFile(actual, expect, config) {
  if (!config) config = { mode: 'equal' }
  var actualContent = fileCache[actual]
  if (!actualContent) {
    actualContent = fs.readFileSync(actual, 'utf8')
    fileCache[actual]
  }
  var expectContent = expect
  if (config.mode === 'equal') {
    expectContent = fs.readFileSync(expect, 'utf8')
    assert.equal(actualContent, expectContent)
  } else {
    var judge = actualContent.indexOf(expectContent) >= 0
    if (!judge) console.error(expectContent)
    assert(judge)
  }
}

function readyToTest() {
  const vm = require('vm');
  return new Promise((resolve, reject) => {
    vm.runInNewContext('require("./fixture/index-prod.js")', { require });
    vm.runInNewContext('require("./fixture/index-devp.js")', { require });
    setTimeout(resolve, 5000);
  });
}

describe('test', function () {
  this.timeout(30000);

  before(readyToTest);

  describe('file recipe', function () {
    it('file must be copied', function () {
      var path1 = path.join(staticDir, 'client-devp/1st/index.html')
      var path2 = path.join(staticDir, 'client-prod/1st/index.html')
      var pathExpect = path.join(fixtureDir, 'client/1st/index.html')
      assertFile(path1, pathExpect)
      assertFile(path2, pathExpect)
    })
  })

  describe('pure recipe', function () {
    it('compile js', function () {
      var path1 = path.join(staticDir, 'client-devp/2nd/index.js')
      var path2 = path.join(staticDir, 'client-prod/2nd/index.js')
      assertFile(path1, 'module a', { mode: 'fuzzy' })
      assertFile(path1, 'module b', { mode: 'fuzzy' })
      assertFile(path2, 'module a', { mode: 'fuzzy' })
      assertFile(path2, 'module b', { mode: 'fuzzy' })
    })
  })

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
    })

    it('compile sass', function () {
      var path1 = path.join(staticDir, 'client-devp/index.css')
      assertFile(path1, '#333', { mode: 'fuzzy' })
      assertFile(path1, 'ul li a:hover', { mode: 'fuzzy' })
    })

    it('launch code', function () {
      var path1 = path.join(staticDir, 'client-devp/launch.js')
      var path2 = path.join(staticDir, 'client-prod/launch.js')
      assertFile(path1, 'epii view not provided', { mode: 'fuzzy' })
      assertFile(path2, 'epii view not provided', { mode: 'fuzzy' })
    })
  })
})
