const path = require('path');
const CSSSplitWebpackPluginHolder = require('css-split-webpack-plugin');
const dotenv = require('dotenv');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const without = require('lodash/without');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const nib = require('nib');
const stylusLoader = require('stylus-loader');
const webpack = require('webpack');
const ManifestPlugin = require('webpack-manifest-plugin');
const WriteFileWebpackPlugin = require('write-file-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const babelConfig = require('./babel.config');
const buildConfig = require('./build.config');
const pkg = require('./package.json');


// const loadJSON = (path) => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
// const pkg = loadJSON('./package.json');

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

dotenv.config();

const publicPath = '';
const buildVersion = pkg.version;
const timestamp = new Date().getTime();

const CSSSplitWebpackPlugin = CSSSplitWebpackPluginHolder.default;

module.exports = {
  mode: 'development',
  cache: true,
  target: 'web',
  context: path.resolve(__dirname, 'src/app'),
  devtool: 'cheap-module-eval-source-map',
  entry: {
    polyfill: [
      path.resolve(__dirname, 'src/app/polyfill/index.js'),
    ],
    app: [
      path.resolve(__dirname, 'src/app/index.jsx'),
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist/app'),
    chunkFilename: `[name].[hash].bundle.js?_=${timestamp}`,
    filename: `[name].js?_=${timestamp}`,
    pathinfo: true,
    publicPath: publicPath,
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        options: {
          ...babelConfig,
          env: {
            development: {
              plugins: ['react-hot-loader/babel']
            }
          }
        },
        exclude: /node_modules/
      },
      {
        test: /\.styl$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: true,
              localIdentName: '[path][name]__[local]--[hash:base64:5]',
              camelCase: true,
              importLoaders: 1
            }
          },
          'stylus-loader'
        ],
        exclude: [
          path.resolve(__dirname, 'src/app/styles')
        ]
      },
      {
        test: /\.styl$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              modules: false,
              camelCase: true,
            }
          },
          'stylus-loader'
        ],
        include: [
          path.resolve(__dirname, 'src/app/styles')
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpg|svg|ico)$/,
        loader: 'url-loader',
        options: {
          limit: 8192
        }
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff'
        }
      },
      {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }
    ]
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty',
    module: 'empty',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development'),
        BUILD_VERSION: JSON.stringify(buildVersion),
        LANGUAGES: JSON.stringify(buildConfig.languages),
        TRACKING_ID: JSON.stringify(buildConfig.analytics.trackingId)
      }
    }),
    new webpack.LoaderOptionsPlugin({
      debug: true
    }),
    new stylusLoader.OptionsPlugin({
      default: {
        // nib - CSS3 extensions for Stylus
        use: [nib()],
        // no need to have a '@import "nib"' in the stylesheet
        import: ['~nib/lib/nib/index.styl']
      }
    }),
    // https://github.com/gajus/write-file-webpack-plugin
    // Forces webpack-dev-server to write bundle files to the file system.
    new WriteFileWebpackPlugin(),
    new webpack.ContextReplacementPlugin(
      /moment[\/\\]locale$/,
      new RegExp('^\./(' + without(buildConfig.languages, 'en').join('|') + ')$')
    ),
    // Generates a manifest.json file in your root output directory with a mapping of all source file names to their corresponding output file.
    new ManifestPlugin({
      fileName: 'manifest.json'
    }),
    new MiniCssExtractPlugin({
      filename: `[name].css?_=${timestamp}`,
      chunkFilename: `[id].css?_=${timestamp}`
    }),
    new CSSSplitWebpackPlugin({
      size: 4000,
      imports: '[name].[ext]?[hash]',
      filename: '[name]-[part].[ext]?[hash]',
      preserve: false
    }),
    new HtmlWebpackPlugin({
      filename: 'index.hbs',
      template: path.resolve(__dirname, 'index.hbs'),
      favicon: path.resolve(__dirname, 'src/app/favicon.ico'),
      chunksSortMode: 'dependency' // Sort chunks by dependency
    }),
    new CopyPlugin({
      patterns: [
        { from: 'images', to: 'images' },
        { from: 'assets', to: 'assets' },
        { from: 'i18n', to: 'i18n' },
      ],
    }),
    new CleanWebpackPlugin()
  ],
  resolve: {
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    extensions: ['.js', '.jsx']
  }
};
