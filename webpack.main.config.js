const path = require('path');

module.exports = {
  entry: './src/main/main.ts',
  target: 'electron-main',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      "path": false,
      "fs": false
    }
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
  },
  optimization: {
    minimize: false
  },
  node: {
    __dirname: false,
    __filename: false
  }
}; 