const path = require('path');

module.exports = {
  entry: './src/preload/preload.ts',
  target: 'electron-preload',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'preload.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            cacheCompression: false
          }
        }
      }
    ]
  },
  stats: {
    colors: true,
    errorDetails: true
  }
}; 