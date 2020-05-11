const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    //devtool: "none",
    entry: {
		index: "./src/index.ts",
	},
    output: {
		path: path.resolve(__dirname, "dist"),
        filename: (data)=>{
			return "[name].js";
		},
		
    },
    plugins: [
		new HtmlWebpackPlugin({
			hash: true,
			minify: {
				collapseWhitespace: false,
				removeComments: false,
				collapseInlineTagWhitespace: false,
				minifyJS: false,
				minifyCSS: false
			},
			chunks: ["index"],
			template: "./src/index.ejs",
			filename: "index.html",
		}),
   	],
   	module: {
	   	rules: [
			{
				test: /\.tsx?$/i,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
			{ 
				test: /\.html$/i,
				use: ["html-loader"]
			},
			{ 
				test: /\.css$/i,
				use: ["style-loader", "css-loader"]
			},
			{
				test: /\.(woff|woff2|ttf)$/,
				use: {
					loader: "url-loader",
					options: {
						limit: 50000,
					},
				},
			},
			{ 
				test: /favicon\.png$/,
				use: [{
					loader: "file-loader",
					options: {
						name: "favicon.png"
					}
				}],
			},
			{
				test: /\.(png|jpg|gif)$/,
				exclude: /favicon\.png$/,
				use: ["url-loader"],
			},
			{ 
				test: /\.(obj|svg)$/i,
				use: ["file-loader"]
			},
			// { 
			// 	test: /^(preview-ships\.obj)$/i,
			// 	use: [{ 
			// 		loader: "file-loader",
			// 		options: {
			// 			name: "preview-ships.obj"
			// 		}
			// 	}],

			// },
			{ // TODO: maybe move these up?
				test: /\.(ogg|mp3|wav|mpe?g)$/i,
				use: ["file-loader"]
			},
			// {
			// 	test: /^(ssbundle.js)$/i,
			// 	use: ["file-loader"]
			// }
			// {
			// 	test: /\.js$/,
			// 	/*use: [{
			// 		loader: "script-loader",
			// 		options: {
			// 			sourceMap: true
			// 		},
			// 	}]*/
			// 	use: "script-loader"
			// }
		]
	},
	resolve: {
		extensions: [ ".tsx", ".ts", ".js" ], // Note: js was removed from this list.
	}
}