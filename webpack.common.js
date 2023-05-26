const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

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
};
