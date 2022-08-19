const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const webpackPlugins = [
	new MiniCssExtractPlugin({
		filename: "bundle.css",
		chunkFilename: "[name].css",
	}),
];

/** Change this to true to analyze the bundle size. */
const analyzeBundle = false;
if(analyzeBundle) webpackPlugins.push(new BundleAnalyzerPlugin());

module.exports = {
	entry: {
		// "doNotUse" a stupid file which gets created as a js file.
		// For some reason it's incredibly hard to have only the scss file generate.
		// So that's why this is named this way.
		doNotUse: glob.sync('./static/scss/**.scss'),
		playlists: './static/scripts/playlistScripts/script.tsx',
		home: './static/scripts/homepageScripts/homePage.tsx',
	},
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, './static/dist/'),
	},
	resolve: {
		extensions: [".ts", ".tsx", ".scss"],
	},
	plugins: webpackPlugins,
	module: {
		rules: [
            {
                test: /\.(j|t)sx?$/,
                exclude: /(node_modules|bower_components)/,
                use:{
                	loader: "ts-loader",
                },
            },
            { 
            	enforce: "pre",
            	test: /\.js$/,
            	exclude: /(node_modules|bower_components)/,
            	loader: "source-map-loader", // I think this makes debugging the source in browser dev-tools easier.
            },
			{
	        	test: /\.s[ac]ss$/i,
	        	use: [
	        		MiniCssExtractPlugin.loader, // Makes new css file
	        		"css-loader", // Translates CSS into CommonJS
	        		"sass-loader"
	        	],
	      	},
		],
	},
	devtool: "source-map",
	mode: 'development',
	watch: true,
};