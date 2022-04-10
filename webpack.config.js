const path = require('path');
// const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: './src/js/fidget-shuriken.js',
    output: {
        filename: 'js/fidget-shuriken.js',
        path: path.resolve(__dirname, 'build'),
    },
    plugins: [],
    module: {
        rules: [
            {
                test: /.p?css$/i,
                use: ['style-loader', 'css-loader', 'postcss-loader'],
            },
            {
                test: /.html$/i,
                use: ['html-loader'],
            }
        ]
    }
}