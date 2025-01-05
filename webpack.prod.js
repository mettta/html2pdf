import webpack from 'webpack';
import { merge } from 'webpack-merge';
import common from './webpack.common.js';
import packageJson from './package.json' with { type: "json" };

export default merge(common, {
  mode: 'production',
  plugins: [
    new webpack.BannerPlugin({
      banner: `/*! Version: ${packageJson.version} */`,
      raw: true,
    }),
  ],
});
