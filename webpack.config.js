const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const webpackPlugins = [
	new MiniCssExtractPlugin({filename: "bundle.css"})
];

const analyzeBundle = false;
if(analyzeBundle) webpackPlugins.push( new BundleAnalyzerPlugin() );

module.exports = {
	entry: {
		playlists: './static/script.js',
		home: './static/homePageScript.js'
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, './static/dist/')
	},
	plugins: webpackPlugins,
	module: {
		rules: [
		 	{
		      test: /\.m?js$/,
		      exclude: /(node_modules|bower_components)/,
		      use: {
		        loader: 'babel-loader',
		        options: {
		          presets: ['@babel/react', '@babel/env']
		        }
		      }
		    },
			{
	         test: /\.s[ac]ss$/i,
	         use: [
	          MiniCssExtractPlugin.loader, // Makes new css file
	          "css-loader", // Translates CSS into CommonJS
	          "sass-loader"
	        ]
	      }
		]
	},
	mode: 'development',
	watch: true
}



