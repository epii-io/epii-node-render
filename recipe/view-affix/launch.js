/**
 * launch code generator
 * => render react view in dom
 *
 * @param  {String} name
 * @param  {String} stub
 * @return {String} result
 */
function genLaunchCode(name, stub) {
  if (!name || !stub) {
    throw new Error('gen launch code, invalid name or stub')
  }
  var code = `
    ;(function () {
      var root = document.getElementById('${name}');
      if (!root) throw new Error('${stub} root not defined');
      var view = window.${stub}.view;
      if (!view) throw new Error('${stub} view not defined');
      ReactDOM.render(React.createElement(view), root);
    }());
    `.replace(/\n|(\s{2})/g, '')
  return code
}

module.exports = genLaunchCode
