'use strict'

const loaderUtils = require('loader-utils')

/**
 * webpack loader
 * settle react view into window
 *
 * @param  {String} source
 * @return {String} result
 */
function concatSettleCode(source) {
  var query = loaderUtils.getOptions(this)
  var holder = query.holder
  if (!holder || !holder.stub) {
    throw new Error('gen settle code, invalid stub')
  }
  var stub = holder.stub
  var code = `
  ;(function () {
    if (window) {
      if (!window.${stub}) window.${stub} = {};
      if (exports) {
        var keys = Object.keys(exports);
        if (keys.length > 0) {
          window.${stub}.view = exports[keys[0]];
        }
      };
    };
    require('react-dom');
  })();
  `.replace(/\n|(\s{2})/g, '')
  return source + code
}

module.exports = concatSettleCode
