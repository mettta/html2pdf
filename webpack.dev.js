const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  },
  plugins: [
    // Index
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'index.html',
      template: './examples/index.html',
      title: '✌ index',
      inject: false,
      // templateParameters: {
      //   dataConfig: 'test',
      // },
    }),

    // Test cases
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'resizing.html',
      template: './examples/test/resizing.html',
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'tags.html',
      template: './examples/test/tags.html',
    }),

    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'all.html',
      template: './examples/test/all.html',
      title: '🧲 all',
      inject: false,
    }),

    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'current.html',
      template: './examples/test/current.html',
      title: '🥁 current test',
      inject: false,
    }),

    // Strictdoc 🌲
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'strictdoc.html',
      template: './examples/strictdoc/index.html',
      title: '🎃 strictdoc',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'cur.html',
      template: './examples/strictdoc/cur.html',
      title: '🐱 current case',
      inject: false,
    }),
    // TEST
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'test.html',
      template: './examples/strictdoc/test.html',
      title: '📍 test',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'test_.html',
      template: './examples/strictdoc/test_.html',
      title: '📍 test',
      inject: false,
    }),

    // CSS
    new CopyWebpackPlugin({
      patterns: [
        { from: './examples/strictdoc/css', to: 'css' },
        { from: './examples/assets', to: 'assets' },
      ],
    }),
  ],
});
