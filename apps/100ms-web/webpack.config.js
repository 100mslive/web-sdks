const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { ESBuildMinifyPlugin } = require("esbuild-loader");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ESLintPlugin = require("eslint-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const CopyPlugin = require("copy-webpack-plugin");
require("dotenv").config();

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, "./build"),
    filename: "[name].[chunkhash:8].js",
    publicPath: "/",
    clean: true,
  },
  target: "web",
  resolve: {
    extensions: [".js", ".jsx", ".css", ".svg"],
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
            loader: "esbuild-loader",
            options: {
              loader: "jsx",
              target: "es6",
            },
          },
        ],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "postcss-loader"],
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: "asset/resource",
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/,
        type: "asset/inline",
      },
    ],
  },
  stats: "errors-only",
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: {
          chunks: "initial",
          name: "vendor",
          enforce: true,
          test: /[\\/]node_modules[\\/]/,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: true,
    minimize: true,
    minimizer: [
      // Use esbuild to minify
      new ESBuildMinifyPlugin(),
    ],
  },
  plugins: [
    new webpack.ProgressPlugin(),
    new ESLintPlugin(),
    new WebpackManifestPlugin(),
    new MiniCssExtractPlugin({
      filename: "[name].[chunkhash:8].css",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "./public"),
          to: path.resolve(__dirname, "./build"),
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
      template: path.resolve(__dirname, "./public/index.html"),
      base: "/",
    }),
    new webpack.ProvidePlugin({
      React: "react",
    }),
    new webpack.DefinePlugin({
      "process.env": JSON.stringify(process.env),
    }),
  ],
  devServer: {
    historyApiFallback: true,
    static: path.resolve(__dirname, "./public"),
    open: true,
    compress: true,
    hot: true,
    port: 3000,
  },
};
