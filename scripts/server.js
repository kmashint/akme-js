// Simple nodejs Web Server.
// No dependencies necessary for NodeJS 8.9.4+.
// Use:  node scripts/server

/* eslint-disable no-console */
/* eslint-disable no-path-concat */
/* eslint-disable prefer-spread */

const useHttps = true;

const fs = require('fs');
const path = require('path');
const http = useHttps ? require('https') : require('http');
const { logger } = require('../common/Logger');
const { apiService } = require('../lib/apiService');

const LOCAL_ORIGIN = (useHttps ? 'https' : 'http') + '://localhost';
const httpHost = 'static.local.adobesigncdn.com';
const httpPort = 9080;
const httpServerArgs = useHttps ? [{
  key: fs.readFileSync(__dirname + '/../etc/local.corp.adobesign.com.key'),
  cert: fs.readFileSync(__dirname + '/../etc/local.corp.adobesign.com.crt')
}] : [];
const baseDirectory = __dirname + '/../dist'; // or whatever base you want
const errCodeMap = {
  // eslint-disable-next-line quote-props
  '404': 'Not Found'
};
const extTypeMap = {
  '': 'application/octet-stream',
  '.css': 'text/css',
  '.html': 'text/html',
  '.ico': 'image/x-icon',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain',
  '.xhtml': 'application/xhtml+xml'
};

// Listen to service file changes and evict cache.
// TODO: Debug since the delete of the require cache doesn't seem to work.
// TODO: Try parcel/watcher.
/*
['./lib/'].forEach(function foundPath(filePath) {
  fs.readdirSync(path.normalize(filePath)).forEach(function watchFile(fileName) {
    logger.log('watchFile:', filePath + fileName);
    fs.watchFile(
      path.normalize(filePath + fileName),
      { interval: 5007 },
      function watched(curr) { // , prev
        logger.log('watchedFile: %s %O', filePath + fileName, curr);
        delete require.cache[require.resolve('.' + filePath + fileName)];
      }
    );
  });
});
*/

// Prepare and serve.
httpServerArgs.push(function handle(req, res) {
  try {
    // Use path.normalize to prevent access to directories underneath baseDirectory.
    const reqUrl = new URL(req.url, LOCAL_ORIGIN);
    let fsPath = baseDirectory + path.normalize(reqUrl.pathname);
    let fsStat;

    try {
      logger.log(fsPath);
      fsStat = fs.statSync(fsPath);
      if (fsStat.isDirectory()) {
        fsPath += '/index.html';
        fsStat = fs.statSync(fsPath);
      }
    }
    catch (er) {
      return apiService(req, res);
      // res.writeHead(404);
      // res.end(errCodeMap[404]);
      // return;
    }

    const headers = {};
    const contentType = extTypeMap[path.extname(fsPath)];
    headers['Content-Type'] = contentType || extTypeMap[''];
    if (fsStat) {
      headers['Cache-Control'] = 'public, max-age=2, must-revalidate';
      headers['Last-Modified'] = new Date(fsStat.mtimeMs).toUTCString();
      headers['Content-Length'] = fsStat.size;
      if (headers['Last-Modified'] === req.headers['if-modified-since']) {
        res.writeHead(304, headers);
        res.end();
        return null;
      }
    }
    const fileStream = fs.createReadStream(fsPath);
    fileStream.pipe(res);
    fileStream.on('open', function open() {
      res.writeHead(200, headers);
      // The pipe() will take care of the res.end().
    });
    fileStream.on('error', function error(er) {
      res.writeHead(404);
      res.end(errCodeMap[404] + ' : ' + String(er));
    });
  }
  catch (er) {
    res.writeHead(500);
    res.end();
    logger.warn(er.stack);
  }
  return null;
});
http.createServer.apply(http, httpServerArgs).listen(httpPort);

logger.info('Listening on ' + (useHttps ? 'https' : 'http') + '://' + httpHost + ':' + httpPort);
logger.info('Use Ctrl-C to stop.');
