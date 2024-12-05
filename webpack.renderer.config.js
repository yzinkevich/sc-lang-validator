const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

class LogPlugin {
  apply(compiler) {
    compiler.hooks.beforeCompile.tap('LogPlugin', () => {
      console.log('Starting compilation...');
    });

    compiler.hooks.compilation.tap('LogPlugin', (compilation) => {
      console.log('Compilation created...');
      
      compilation.hooks.buildModule.tap('LogPlugin', (module) => {
        if (!module.userRequest?.includes('node_modules')) {
          console.log('Building module:', module.userRequest);
        }
      });

      compilation.hooks.finishModules.tap('LogPlugin', (modules) => {
        console.log('Finished building modules');
      });

      compilation.hooks.seal.tap('LogPlugin', () => {
        console.log('Sealing compilation...');
      });

      compilation.hooks.optimizeDependencies.tap('LogPlugin', () => {
        console.log('Optimizing dependencies...');
      });

      compilation.hooks.afterOptimizeDependencies.tap('LogPlugin', () => {
        console.log('Finished optimizing dependencies');
      });

      compilation.hooks.optimizeModules.tap('LogPlugin', () => {
        console.log('Optimizing modules...');
      });

      compilation.hooks.afterOptimizeModules.tap('LogPlugin', () => {
        console.log('Finished optimizing modules');
      });

      compilation.hooks.afterSeal.tap('LogPlugin', () => {
        console.log('Compilation sealed');
      });
    });

    compiler.hooks.done.tap('LogPlugin', (stats) => {
      console.log('Compilation finished');
    });
  }
}

module.exports = {
  entry: './src/renderer/index.tsx',
  target: 'electron-renderer',
  mode: process.env.NODE_ENV || 'development',
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'renderer.js',
    publicPath: './'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    fallback: {
      "path": false,
      "fs": false
    },
    alias: {
      '@mui/material': path.resolve(__dirname, 'node_modules/@mui/material'),
      '@mui/icons-material': path.resolve(__dirname, 'node_modules/@mui/icons-material'),
      '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled')
    }
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
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
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
      filename: 'index.html',
      inject: true,
      minify: false
    }),
    new LogPlugin()
  ],
  watchOptions: {
    ignored: /node_modules/,
  },
  stats: {
    colors: true,
    errorDetails: true,
    chunks: false,
    modules: false,
    logging: 'verbose',
    loggingTrace: true
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
    runtimeChunk: false,
    minimize: false,
    concatenateModules: false,
    usedExports: false,
    providedExports: false
  },
  infrastructureLogging: {
    level: 'verbose',
    debug: true
  },
  cache: false,
  performance: {
    hints: false
  },
  devServer: {
    port: 8080,
    hot: true,
    compress: true,
    static: {
      directory: path.join(__dirname, 'dist'),
      publicPath: '/'
    }
  }
}; 