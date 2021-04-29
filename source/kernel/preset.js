const assist = require('./assist');

/**
 * get babel config
 *
 * @return {Object} babel config
 */
function getBabelConfig() {
  return {
    presets: [
      [
        assist.resolve('@babel/preset-env'),
        { exclude: ['@babel/plugin-transform-regenerator'] }
      ],
      assist.resolve('@babel/preset-react')
    ],
    plugins: [
      assist.resolve('@babel/plugin-transform-async-to-generator')
    ]
  };
}

module.exports = {
  getBabelConfig,
}