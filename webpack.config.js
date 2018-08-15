const path = require('path');
var glob = require("glob");
const webpack = require('webpack');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const devMode = process.env.NODE_ENV !== 'production'

module.exports = {
  entry: {
    app:  './src/anol/anol.js',
    vendor: ['angular', 'jquery', 'ol']
  },    
  output: {
    filename: 'anol.[name].js',
    path: path.resolve(__dirname, './build'),
    chunkFilename: 'anol.[name].bundle.js',
    publicPath: '/',
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
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: 'initial',
          name: 'vendor',
          test: 'vendor',
          enforce: true
        },
      }
    },
    runtimeChunk: true
  },    
  plugins: [
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      'window.jQuery': 'jquery'
    })
  ]
};
