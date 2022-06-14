const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: {
    index: './src/index.js',
  },
  mode: 'production',
  output: {
    path: path.resolve(__dirname, './lib'),
    filename: '[name].js',
    library: 'library',
    libraryTarget: 'commonjs',
    library: 'default',
    globalObject: 'this'
  },
  resolve: {
    extensions: ['.js']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './src/plugin.js',
          to: 'plugin.js'
        }
      ]
    })
  ]
}