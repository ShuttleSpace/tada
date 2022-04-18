const Path = require('path')

const pkgJson = require('../package.json')

const useThreads = process.env.npm_config_threads
const useNativeThreads = !useThreads

const conditionalCompiler = {
  loader: 'js-conditional-compile-loader',
  options: {
    useThreads,
    useNativeThreads,
  }
}

const entry = { main: Path.join(process.cwd(), 'index.js') }
if (useNativeThreads) {
  entry.worker = Path.join(process.cwd(), 'worker_threads/worker.js')
} else {
  entry.worker = Path.join(process.cwd(), 'threads/worker.js')
}

module.exports = {
  entry,
  externals: [...Object.keys(pkgJson.dependencies || {})],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: [Path.resolve(process.cwd())],
        use: [
          'babel-loader?cacheDirectory',
          conditionalCompiler
        ]
      }
    ]
  },
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    path: Path.join(process.cwd(), 'dist')
  },
  target: 'electron-main',
  devtool: 'hidden-source-map',
  mode: 'production'
}