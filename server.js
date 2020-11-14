// Simple nodejs Web Server.
// No dependencies necessary for NodeJS 8.9.4+.
// Use:  node server.js

/*eslint no-console: 0 */

var useHttps = false,
    http = require(useHttps ? "https" : "http"),
    httpPort = 8081,
    httpServerArgs = useHttps ? [{
        key: fs.readFileSync(__dirname + "/etc/server.key"),
        cert: fs.readFileSync(__dirname + "/etc/server.crt")
    }] : [],
    fs = require("fs"),
    path = require("path"),
    url = require("url"),
    baseDirectory = __dirname + "/web",  // or whatever base you want
    extTypeMap = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".svg": "image/svg+xml",
        ".xhtml": "application/xhtml+xml"
    };

httpServerArgs.push(function (req, res) {
    try {
        // Use path.normalize to prevent access to directories underneath baseDirectory.
        var reqUrl = url.parse(req.url),
            fsPath = baseDirectory + path.normalize(reqUrl.pathname),
            fsStat,
            fileStream;

        try {
            fsStat = fs.statSync(fsPath);
            if (fsStat.isDirectory()) fsPath += "/index.html";
        } catch (er) {
            undefined;
        }

        fileStream = fs.createReadStream(fsPath);
        fileStream.pipe(res);
        fileStream.on("open", function () {
            var headers = {},
                contentType = extTypeMap[path.extname(fsPath)];
            if (contentType) headers["Content-Type"] = contentType;
            headers["Cache-Control"] = "public, max-age=60";
            res.writeHead(200, headers);
            // The pipe() will take care of the res.end().
        });
        fileStream.on("error", function (er) {
            res.writeHead(404);
            res.end();
        });
    } catch (er) {
        res.writeHead(500);
        res.end();
        console.warn(er.stack);
    }
});
http.createServer.apply(http, httpServerArgs).listen(httpPort);

console.info("Listening on " + (useHttps ? "https" : "http") + "://localhost:" + httpPort);
console.info("Use Ctrl-C to stop.");
