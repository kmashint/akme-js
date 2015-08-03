// build.js
// Build script based on node.js with the following dependencies:
//      npm -g install uglify-js@2.4
// Remember to have your NODE_PATH environment variable set appropriately.
// e.g. NODE_PATH on Windows is typically the expansion of %AppData%\npm\node_modules.
// http://stackoverflow.com/questions/7970793/how-do-i-import-global-modules-in-node-i-get-error-cannot-find-module-module
//
/*jshint node:true */

var fsys = require('fs'),
    UglifyJS = require("uglify-js"),
    include = ["akme-core","akme-context","akme-dom","akme-more","akme-storage","akme-couch"],
    srcPath = "../src",
    srcFile = "../web/common/akme-core.src.js",
    minFile = srcFile.replace(/\.src\.js$/, ".min.js");

console.log(new Date());
//console.log(process.argv, __dirname);

console.log("Append "+ srcFile);
fsys.writeFileSync(srcFile, "");
for (var i=0; i<include.length; i++) {
    fsys.appendFileSync(srcFile, fsys.readFileSync(srcPath+"/"+include[i]+".js"));
}
console.log("Compress "+ minFile);
fsys.writeFileSync(minFile, UglifyJS.minify(srcFile));

console.log("Done.");
console.log(new Date());

/*
// RequireJS is too narcissistic.  It's too hard to use to compress something not using it.
var requirejs = require('./r.js');
var config = {
    baseUrl: __dirname +'/../web/common',
    name: "akme-core",
    out: minFile,
    paths: {
        "akme-core": "akme-core.src",
        jQuery: "empty:"
    },
    shim: {
        "akme-core": {
            exports: "akme"
        }
    }
};

requirejs.optimize(config, function (result) {
    console.log(result);
}, function (error) {
    console.log(String(error));
});
*/