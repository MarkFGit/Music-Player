const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
/*const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;*/

module.exports = {
	/*entry: './static/script.js',*/
	entry: {
		playlists: './static/script.js',
		home: './static/globalEventListener.js'
	},
	output: {
		/*filename: 'bundle.js',*/
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, './static/dist/')
	},
	plugins: [
	 new MiniCssExtractPlugin({filename: "bundle.css"}),
	 /*new BundleAnalyzerPlugin()*/
	],
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



