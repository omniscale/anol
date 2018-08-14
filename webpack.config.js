const path = require('path');
var glob = require("glob");
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
  entry: './src/anol/anol.js',
  output: {
    path: __dirname,
    filename: 'build/anol.js',
    library: 'anol'
  },
  module: {
    rules: [
      {
        test: /\.sass$/,
        use: [
          "style-loader", // creates style nodes from JS strings
          "css-loader", // translates CSS into CommonJS
          "sass-loader" // compiles Sass to CSS, using Node Sass by default
        ]
      },
      { 
        test: /\.html$/, 
        use: ['html-loader']
      }
    ]
  },  
  plugins: [
      new webpack.ProvidePlugin({
          $: "jquery",
          jQuery: "jquery",
          'window.jQuery': 'jquery'
      })
  ]
};
