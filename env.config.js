const path = require('path');

const outputConfig = {
    destPath: "./dist"
};

// Entry points
const entryConfig = [
    "./src/App.ts"
];


// Copy files from src to dist
const copyPluginPatterns = {
    patterns: [
        { from: "./src/assets/images", to: "images" }
    ]
};


// Dev server setup
// https://webpack.js.org/configuration/dev-server/
const devServer = {
    static: {
        directory: path.join(__dirname, outputConfig.destPath),
    },
    https: false,
    port: "8080",
    host: "0.0.0.0",
    // disableHostCheck: true
};


// SCSS compile
const scssConfig = {
    destFileName: "css/app.min.css"
};


// Production terser config options
const terserPluginConfig = {
    extractComments: false,
    terserOptions: {
        compress: {
            drop_console: true,
        },
    }
};

module.exports.copyPluginPatterns = copyPluginPatterns;
module.exports.entryConfig = entryConfig;
module.exports.scssConfig = scssConfig;
module.exports.devServer = devServer;
module.exports.terserPluginConfig = terserPluginConfig;
module.exports.outputConfig = outputConfig;