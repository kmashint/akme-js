// Remove useless warnings.
var ins = WScript.StdIn,
	ous = WScript.StdOut,
	lineAry = [], i;
//
while (!ins.AtEndOfStream) {
	//ous.WriteLine(ins.ReadLine() ); continue;
	lineAry.push( ins.ReadLine() );
	if (/Try to use a single 'var' statement per scope/.test(lineAry[lineAry.length-1])) {
		lineAry.length = 0;
		skip(2);
	} else if (lineAry.length > 1) {
		write(lineAry);
		lineAry.length = 0;
	}
}
write(lineAry);
//
function skip(n) { for (var i=0; i<n && !ins.AtEndOfStream; i++) ins.ReadLine(); }
function write(a) { for (var i=0; i<a.length; i++) ous.WriteLine(a[i]); }
