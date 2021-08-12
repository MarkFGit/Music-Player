const path = require('path');

module.exports = {
	entry: './static/script.js', /*consider code splitting for entry*/
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, './static/dist/')
	},
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
		    }
		]
	},
	mode: 'development',
	watch: true
}



