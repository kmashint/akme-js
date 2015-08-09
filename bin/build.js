// build.js
// Build script based on node.js with the following dependencies:
//      npm install -g uglify-js@2.4
// Ensure your NODE_PATH environment variable is set appropriately.
// Use  npm root -g  to show the default NODE_PATH.
// Use  npm list -g --depth=0  to list the modules installed to the global node path.
// http://stackoverflow.com/questions/7970793/how-do-i-import-global-modules-in-node-i-get-error-cannot-find-module-module
//
/*jshint node:true */

var fsys = require('fs'),
    UglifyJS = require("uglify-js"),
    srcPath = "../src",
    dstPath = "../web/common";

console.log(new Date());
//console.log(process.argv, __dirname);

compress("akme-core.src.js",
        ["akme-core","akme-context","akme-dom","akme-more","akme-storage","akme-couch"]);

console.log("Done.");
console.log(new Date());

function compress(srcName, includeAry) {
    var minName = srcName.replace(/\.src\.js$/, ".min.js"),
        mapName = minName.replace(/$/, ".map"),
        srcFile = dstPath+"/"+srcName,
        minFile = dstPath+"/"+minName,
        mapFile = dstPath+"/"+mapName;
    
    console.log("Append "+ srcFile);
    fsys.writeFileSync(srcFile, "");
    for (var i=0; i<includeAry.length; i++) {
        fsys.appendFileSync(srcFile, fsys.readFileSync(srcPath+"/"+includeAry[i]+".js"));
    }
    console.log("Compress "+ minFile);
    var compressed = UglifyJS.minify(srcFile, {
        compress:true, warnings:true, outSourceMap: mapFile
    });
    fsys.writeFileSync(minFile, compressed.code);
    if (mapFile) fsys.writeFileSync(mapFile, compressed.map);
    else if (fsys.existsSync(mapFile)) fsys.unlinkSync(mapFile);
}

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