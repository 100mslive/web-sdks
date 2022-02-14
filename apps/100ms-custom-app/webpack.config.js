const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const CopyPlugin = require('copy-webpack-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
  mode: isProduction ? 'production' : 'development',
  context: path.resolve(__dirname, 'src'),
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, './build'),
    filename: 'static/js/[name].[chunkhash:8].js',
    assetModuleFilename: 'static/media/[name].[hash][ext]',
    publicPath: '/',
    clean: true,
    devtoolModuleFilenameTemplate: info => {
      return path.relative(path.resolve(__dirname, 'src'), info.absoluteResourcePath).replace(/\\/g, '/');
    },
  },
  devtool: isProduction ? 'source-map' : 'cheap-module-source-map',
  target: 'web',
  resolve: {
    extensions: ['.js', '.jsx', '.css', '.svg'],
    fallback: {
      path: false,
      fs: false,
      events: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        use: [
          {
            loader: 'esbuild-loader',
            options: {
              loader: 'jsx',
              target: 'es6',
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|)$/,
        type: 'asset/inline',
      },
    ],
  },
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '.cache'),
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          name: 'vendor',
          enforce: true,
          test: /[\\/]node_modules[\\/]/,
          reuseExistingChunk: true,
          chunks: 'all',
        },
        default: {
          reuseExistingChunk: true,
          chunks: 'all',
        },
      },
    },
    runtimeChunk: false,
    minimize: isProduction,
    minimizer: [new ESBuildMinifyPlugin()],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new ESLintPlugin({ fix: true }),
    new WebpackManifestPlugin({
      fileName: 'asset-manifest.json',
      publicPath: '/',
      generate: (seed, files, entrypoints) => {
        const manifestFiles = files.reduce((manifest, file) => {
          manifest[file.name] = file.path;
          return manifest;
        }, seed);
        const entrypointFiles = entrypoints.main.filter(fileName => !fileName.endsWith('.map'));

        return {
          files: manifestFiles,
          entrypoints: entrypointFiles,
        };
      },
    }),
    // ...(process.env.NODE_ENV !== 'production' ? [new BundleAnalyzerPlugin()] : []),
    new MiniCssExtractPlugin({
      filename: 'static/css/[name].[chunkhash:8].css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, './public'),
          to: path.resolve(__dirname, './build'),
          filter: async resourcePath => {
            if (/index.html|manifest.json/.test(resourcePath)) {
              return false;
            }
            return true;
          },
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
      base: '/',
    }),
    new webpack.ProvidePlugin({
      React: 'react',
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
  ],
  devServer: {
    historyApiFallback: true,
    static: path.resolve(__dirname, './public'),
    open: true,
    compress: true,
    hot: true,
    port: 3000,
  },
};
