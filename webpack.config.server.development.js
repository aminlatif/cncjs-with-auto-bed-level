const path = require('path');
// const CSSSplitWebpackPlugin = require('css-split-webpack-plugin').default;
// const dotenv = require('dotenv');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const without = require('lodash/without');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const nib = require('nib');
// const stylusLoader = require('stylus-loader');
const webpack = require('webpack');
// const ManifestPlugin = require('webpack-manifest-plugin');
// const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const babelConfig = require('./babel.config');
// const buildConfig = require('./build.config');
// const pkg = require('./src/package.json');

// dotenv.config();

const publicPath = path.resolve(__dirname, 'public') + '/';
// const buildVersion = pkg.version;
const timestamp = new Date().getTime();

module.exports = {
  mode: 'development',
  cache: true,
  target: 'node',
  context: path.resolve(__dirname, 'src/server'),
  devtool: 'cheap-module-eval-source-map',
  entry: {
    server: [
      path.resolve(__dirname, 'src/server/server.js')
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist/server'),
    chunkFilename: `[name].[hash].bundle.js?_=${timestamp}`,
    filename: `[name].js?_=${timestamp}`,
    pathinfo: true,
    publicPath: publicPath
  },
  module: {
    rules: [
      {
        test: /\.js$|jsx/,
        loader: 'babel-loader',
        options: {
          ...babelConfig,
        },
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[path][name]__[local]--[hash:base64:5]',
              camelCase: true,
              importLoaders: 1
            }
          }
        ],
      },
    ]
  },
  plugins: [
    new webpack.DefinePlugin({ 'global.GENTLY': false }),
    new MiniCssExtractPlugin({
      filename: `[name].css?_=${timestamp}`,
      chunkFilename: `[id].css?_=${timestamp}`
    }),
  ],
  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    extensions: ['.js']
  },
  externals: {
    consolidate: 'commonjs consolidate',
    uws: 'uws',
    'utf-8-validate': 'utf-8-validate',
    bufferutil: 'bufferutil',
    express: { commonjs: 'express' },
    webappengine: { commonjs: 'webappengine' },
    'socket.io': { commonjs: 'socket.io' },
    'i18next-node-fs-backend': { commonjs: 'i18next-node-fs-backend' },
    'errorhandler': { commonjs: 'errorhandler' },
  }
};
