const Path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const pkgJson = require('../package.json')

module.exports = {
  entry: { renderer: Path.join(process.cwd(), 'renderer.js') },
  externals: [...Object.keys(pkgJson.dependencies || {})],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          'babel-loader?cacheDirectory',
        ]
      }
    ]
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: Path.join(process.cwd(), 'dist')
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: Path.join(process.cwd(), 'index.html'),
          to: Path.join(process.cwd(), 'dist')
        }
      ]
    })
  ],
  target: 'electron-renderer',
  devtool: 'hidden-source-map',
  mode: 'production'
}