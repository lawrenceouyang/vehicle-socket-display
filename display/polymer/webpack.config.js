var debug = process.env.NODE_ENV !== "production";
var webpack = require('webpack');
var path = require('path');

module.exports = {
    context: path.join(__dirname, "src"),
    devtool: debug ? "inline-sourcemap" : null,
    entry: {
        display: "./display.js",
        no_location: "./no_location.js",
        ajax_display: "./ajax_display.js"
    },
    module: {
        loaders: [
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: 'file-loader',
                query:{
                    name: '[name].[ext]?[hash]'
                }
            },
            {
                test: /\.html/,
                loader: 'wc-loader'
            },
            {
                test: /\.js/,
                loader: 'strip-loader?strip[]=console.log'
            }
        ]
    },
    output: {
        path: __dirname + "/../static/display/assets",
        filename: "[name]-bundle.min.js",
        publicPath: "/static/display/assets/"
    },
    plugins: [
    new webpack.DefinePlugin({
    "process.env": {
       NODE_ENV: JSON.stringify(process.env.NODE_ENV)
     }
    }),
    new webpack.ProvidePlugin({
        $: "jquery",
        jQuery: "jquery",
        "window.jQuery": "jquery",
        moment: "moment"
    })
  ]
};

if (!debug)
    module.exports.plugins.push(
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        new webpack.optimize.UglifyJsPlugin({ mangle: false, sourcemap: false, compress: {warnings: false}})
    );