const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlWebpackInjectAttributesPlugin = require('html-webpack-inject-attributes-plugin');

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
      attributes: {
        'data-src': function (tag) { return tag.attributes.src },
        'config': '{printLeftMargin: 40,}',
      },
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'isolated.html',
      template: './examples/isolated.html',
    }),
    new HtmlWebpackPlugin({
      appMountId: 'app',
      filename: 'strictdoc.html',
      template: './examples/strictdoc.html',
    }),
    new htmlWebpackInjectAttributesPlugin()
  ],
});
