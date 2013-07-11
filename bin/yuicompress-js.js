var ins = WScript.StdIn,
	ous = WScript.StdOut,
	line, i;
while (!ins.AtEndOfStream) {
	line = ins.ReadLine();
	if (/Try to use a single 'var' statement per scope/.test(line)) 
		skip(2);
	else
		ous.WriteLine(line);
}
function skip(n) { for (i=0; i<n && !ins.AtEndOfStream; i++) ins.ReadLine(); }
