import { fileURLToPath } from 'url';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from "terser-webpack-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
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
    library: {
      name: 'HTML2PDF4DOC',
      type: 'var',
    },
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
