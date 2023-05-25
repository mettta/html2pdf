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
      title: '&star; isolated',
      filename: 'isolated.html',
      template: './examples/isolated.html',
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      title: '&star; simple',
      filename: 'simple.html',
      template: './examples/simple.html',
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      title: '&star; STRICTDOC',
      filename: 'strictdoc.html',
      template: './examples/strictdoc.html',
    })
  ],
});
