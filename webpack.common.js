const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: {
    app: './src/index.js',
  },
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     appMountId: 'app',
  //     title: '&star; Production',
  //     filename: 'index.html'
  //   })
  // ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  // https://stackoverflow.com/questions/64818489/webpack-omit-creation-of-license-txt-files
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};
