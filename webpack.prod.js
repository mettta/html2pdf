const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const packageJson = require('./package.json');

module.exports = merge(common, {
  mode: 'production',
  plugins: [
    new webpack.BannerPlugin({
      banner: `/*! Version: ${packageJson.version} */`,
      raw: true,
    }),
  ],
});
