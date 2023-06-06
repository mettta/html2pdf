const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
  },
  plugins: [
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
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'strictdoc.html',
      template: './examples/strictdoc.html',
      title: '🌲 strictdoc',
      inject: false,
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'resizing.html',
      template: './examples/resizing.html',
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'isolated.html',
      template: './examples/isolated.html',
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'tags.html',
      template: './examples/tags.html',
    }),
  ],
});
