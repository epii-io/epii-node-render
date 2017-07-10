const assert = require('assert')
const fs = require('fs')
const path = require('path')
const child_process = require('child_process')

var fixtureDir = path.join(__dirname, './fixture')
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
  child_process.execSync('rm -rf ' + path.join(fixtureDir, 'static'))
  var vm = require('vm')
  vm.runInNewContext('require("./fixture/index.js")', { require })
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 5000)
  })
}

describe('test', function () {
  this.timeout(30000)

  before(function () {
    return readyToTest()
  })

  describe('file recipe', function () {
    it('file must be copied', function () {
      var path1 = path.join(fixtureDir, 'static/client-devp/1st/index.html')
      var path2 = path.join(fixtureDir, 'static/client-prod/1st/index.html')
      var pathExpect = path.join(fixtureDir, 'client/1st/index.html')
      assertFile(path1, pathExpect)
      assertFile(path2, pathExpect)
    })
  })

  describe('pure recipe', function () {
    it('compile js', function () {
      var path1 = path.join(fixtureDir, 'static/client-devp/2nd/index.js')
      var path2 = path.join(fixtureDir, 'static/client-prod/2nd/index.js')
      assertFile(path1, 'module a', { mode: 'fuzzy' })
      assertFile(path1, 'module b', { mode: 'fuzzy' })
      assertFile(path2, 'module a', { mode: 'fuzzy' })
      assertFile(path2, 'module b', { mode: 'fuzzy' })
    })
  })

  describe('sass recipe', function () {
    it('compile sass', function () {
      var path1 = path.join(fixtureDir, 'static/client-devp/index.css')
      assertFile(path1, '#333', { mode: 'fuzzy' })
      assertFile(path1, 'ul li a:hover', { mode: 'fuzzy' })
    })
  })

  describe('view recipe', function () {
    it('compile jsx', function () {
      var path1 = path.join(fixtureDir, 'static/client-devp/1st/index.js')
      var path2 = path.join(fixtureDir, 'static/client-prod/1st/index.js')
      assertFile(path1, '\'first react view\'', { mode: 'fuzzy' })
      assertFile(path1, '\'header\'', { mode: 'fuzzy' })
      assertFile(path1, 'settle loader', { mode: 'fuzzy' })
      assertFile(path2, '"first react view"', { mode: 'fuzzy' })
      assertFile(path2, '"h1",null,"header"', { mode: 'fuzzy' })
      assertFile(path2, 'settle loader', { mode: 'fuzzy' })
    })

    it('launch code', function () {
      var path1 = path.join(fixtureDir, 'static/client-devp/launch.js')
      var path2 = path.join(fixtureDir, 'static/client-prod/launch.js')
      assertFile(path1, 'undefined epii view', { mode: 'fuzzy' })
      assertFile(path2, 'undefined epii view', { mode: 'fuzzy' })
    })
  })
})
