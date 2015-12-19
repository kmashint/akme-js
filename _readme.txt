_readme.txt for akme-js

Use bin/build.js for NodeJS-based build.

NodeJS notes, need to move away from yuicompress:
	npm install -g uglifyjs@2.4  # for JS minification
	npm install -g phantomjs@1.9  # to test in a full simulated browser
	# http://phantomjs.org/screen-capture.html
	# https://github.com/ariya/phantomjs/blob/master/examples/rasterize.js
	# http://cairosvg.org/documentation/ - Python svg2pdf etc.
	# http://stackoverflow.com/questions/6875807/convert-svg-to-pdf - Java Batik svg2pdf

Git notes:
git config --global --bool core.autocrlf false
git config --global --bool pull.rebase true

For DataTable, toJSON {key:["",...],head:["",...],body:[[],...]}.
Can then use toJSON when saving (check if typeof obj.toJSON === "function").

Also note:
http://jshint.com/
http://www.jslint.com/jslint.js
http://www.jslint.com/webjslint.js

Older:
yuicompressor via bin/yuicompress-js.cmd provides minification/obfuscation.

