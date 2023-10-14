// cscript-test.js for Microsoft JScript
// Use: cscript cscript-test.js
// See: cscript /?

if (!this.console) this.console = {
  log: function (a,b,c,d,e,f,g,h,i,j) { WScript.Echo(a,b,c,d,e,f,g,h,i,j); },
  debug: this.log,
  info: this.log,
  warn: this.log,
  error: this.log
};

if (!this.AkmeMS) this.AkmeMS = {
 	wbemFast : 16 | 32,

	fso : new ActiveXObject("Scripting.FileSystemObject"),  // https://ss64.com/vb/filesystemobject.html
	net : new ActiveXObject("WScript.Network"),  // https://ss64.com/vb/network.html
  sha : new ActiveXObject("Shell.Application"),  // https://ss64.com/vb/shell.html
	wsh : new ActiveXObject("WScript.Shell"),  // https://ss64.com/vb/shell.html
  
  // https://learn.microsoft.com/en-us/windows/win32/wmisdk/wmi-reference
  // https://learn.microsoft.com/en-us/windows/win32/wmisdk/creating-a-wmi-script
  wmi: new ActiveXObject("WbemScripting.SWbemLocator").ConnectServer(".", "root\\cimv2"),
	wmiInstancesOf : function(path) { return this.wmi.InstancesOf(path, this.wbemFast); },
	wmiExecQuery : function(qry) { return this.wmi.ExecQuery(qry, this.wbemFast); }
};

console.log("User:", AkmeMS.net.UserDomain + "\\" + AkmeMS.net.UserName);
console.log("Computer:", AkmeMS.net.ComputerName);

for (var en = new Enumerator(AkmeMS.wmiInstancesOf("Win32_LogicalDisk")); !en.atEnd(); en.moveNext()) {
  var item = en.item();
  console.log(item.Name, item.Description); // key=DeviceID
}
