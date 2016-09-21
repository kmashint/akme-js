# akme-js
JavaScript library for HTML5+MSIE8 Development

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

Microsoft JScript:
WSH and up to MSIE 8: https://msdn.microsoft.com/en-us/library/hbxc2t98%28v=vs.85%29.aspx
MSIE 9+: https://msdn.microsoft.com/en-us/library/d1et7k7c%28VS.94%29.aspx
Windows specific examples: https://gallery.technet.microsoft.com/scriptcenter/Simple-JScriptJavascript-2a46ed8b
Use JScript (try/catch/finally), much more reliable than VBScript, convert VBScript examples to JScript.

For DataTable, toJSON {key:["",...],head:["",...],body:[[],...]}.
Can then use toJSON when saving (check if typeof obj.toJSON === "function").

Also note:
http://jshint.com/
http://www.jslint.com/jslint.js
http://www.jslint.com/webjslint.js

Older:
yuicompressor via bin/yuicompress-old.cmd provides minification/obfuscation.

