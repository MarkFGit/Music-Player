const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
	entry: './static/script.js',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, './static/dist/')
	},
	plugins: [
	 new MiniCssExtractPlugin({filename: "bundle.css"})
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



