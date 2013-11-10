_readme.txt for akme-js

yuicompressor via bin/yuicompress-js.cmd provides minification/obfuscation.

Also note:
http://www.jslint.com/jslint.js
http://www.jslint.com/webjslint.js

For DataTable, toJSON {cols:["",...],rows:[[],...]}.
dt.addRowsOfObjects to convert from [{name:"value"}].
Can then use toJSON when saving (check if tyepof obj.toJSON === "function").
