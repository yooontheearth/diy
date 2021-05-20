const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const ROOT_PATH = path.resolve(__dirname, '../');
const DIST_RELATIVE_PATH = 'public/dist'
const DIST_PATH = path.resolve(ROOT_PATH, DIST_RELATIVE_PATH);


module.exports = {
    entry: {
        diy: path.resolve(ROOT_PATH, 'vuejs/index.js')
    },
    mode:'development',
    devtool: "inline-source-map",
    devServer: {
        contentBase: DIST_PATH,
        hot:true
    },
    plugins: [
        new CleanWebpackPlugin([DIST_RELATIVE_PATH], {
            root: ROOT_PATH
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new VueLoaderPlugin()
    ],
    output: {
        filename: '[name].bundle.js',
        path: DIST_PATH,
        publicPath: '/'
    },
    optimization: {
        splitChunks: {
            chunks: "all"
        }
    },
    resolve: {
        extensions: ['.js', '.vue'],
        alias: {
            'vue': 'vue/dist/vue.js'
        }
    },
    module: {
        rules: [
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use:[
                    'file-loader'
                ]
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader'
            },
            {
                test: /\.styl(us)?$/,
                use: [
                    'vue-style-loader',
                    'css-loader',
                    'stylus-loader'
                ]
            },
            {
                test: /\.pug$/,
                loader: 'pug-plain-loader'
            }
        ]
    }
};