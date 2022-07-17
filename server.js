// Simple nodejs Web Server.
// No dependencies necessary for NodeJS 8.9.4+.
// Use:  node server.js

/* eslint-disable no-console */
/* eslint-disable no-path-concat */
/* eslint-disable prefer-spread */
/* eslint-disable quote-props */

var fs = require("fs"),
    path = require("path"),
    useHttps = false,
    LOCAL_ORIGIN = (useHttps ? 'https' : 'http') + '://localhost',
    http = require(useHttps ? "https" : "http"),
    httpHost = "localhost",
    httpPort = 8081,
    httpServerArgs = useHttps ? [{
        key: fs.readFileSync(__dirname + "/etc/server.key"),
        cert: fs.readFileSync(__dirname + "/etc/server.crt")
    }] : [],
    baseDirectory = __dirname + "/web",  // or whatever base you want
    errCodeMap = {
        '404': 'Not Found'
    },
    extTypeMap = {
        "": "application/octet-stream",
        ".css": "text/css",
        ".html": "text/html",
        ".ico": "image/x-icon",
        ".js": "application/javascript",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".txt": "plain/text",
        ".xhtml": "application/xhtml+xml"
    };

httpServerArgs.push(function (req, res) {
    try {
        // Use path.normalize to prevent access to directories underneath baseDirectory.
        var reqUrl = new URL(req.url, LOCAL_ORIGIN);
            fsPath = baseDirectory + path.normalize(reqUrl.pathname),
            fsStat = null,
            fileStream = null;

        try {
            console.log(fsPath);
            fsStat = fs.statSync(fsPath);
            if (fsStat.isDirectory()) {
                fsPath += "/index.html";
                fsStat = fs.statSync(fsPath);
            }
        } catch (er) {
            res.writeHead(404);
            res.end(errCodeMap[404] + ' : ' + String(er));
            return null;
        }

        var headers = {},
            contentType = extTypeMap[path.extname(fsPath)];
        headers["Content-Type"] = contentType || extTypeMap[""];
        if (fsStat) {
            headers["Cache-Control"] = "public, max-age=60";
            headers["Last-Modified"] = new Date(fsStat.mtimeMs).toUTCString();
            headers["Content-Length"] = fsStat.size;
            if (headers["Last-Modified"] === req.headers["if-modified-since"]) {
                res.writeHead(304, headers);
                res.end();
                return null;
            }
        }
        fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(res);
        fileStream.on("open", function () {
            res.writeHead(200, headers);
            // The pipe() will take care of the res.end().
        });
        fileStream.on("error", function (er) {
            res.writeHead(404);
            res.end(errCodeMap[404] + ' : ' + String(er));
        });
    } catch (er) {
        res.writeHead(500);
        res.end();
        console.warn(er.stack);
    }
    return null;
});
http.createServer.apply(http, httpServerArgs).listen(httpPort);

console.info("Listening on " + (useHttps ? "https" : "http") + "://" + httpHost + ":" + httpPort);
console.info("Use Ctrl-C to stop.");
