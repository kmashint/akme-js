/*
  process-win.js
  Find Windows Process.
  cscript //b //nologo process-win.js
*/

var AkmeMS = {
  // wmi.InstancesOf("...", this.wmiFast) or wmi.ExecQuery("SELECT * FROM ...", "WQL", this.wmiFast)
  wmiFast: 0x30, // 0x10: wbemFlagReturnImmediately + 0x20: wbemFlagForwardOnly
  wmiTimeout: -2147209215,

  wbemFlagReturnImmeidately: 0x10,
  wbemFlagForwardOnly: 0x20,

  wbemRemoteShutdown: 23,
  wbemAnonymous: 1,
  wbemIdentify: 2,
  wbemImpersonate: 3,
  wbemDelegate: 4,

  wmi: (function (wbemLoc) {
      wbemLoc.Security_.ImpersonationLevel = 3;
      return wbemLoc.ConnectServer(".", "root/cimv2");
      }(new ActiveXObject("WbemScripting.SWbemLocator"))),
  // These are meant for fast read-only without method calls.
  // To use WMI method calls, use AkmeMS.wmi.ExecQuery(qry).
  wmiInstancesOf: function(path) { return this.wmi.InstancesOf(path, this.wmiFast); },
  wmiExecQuery: function(qry) { return this.wmi.ExecQuery(qry, this.wmiFast); }
};

/*
  /Processid:{CB3B0003-8088-4EDE-8769-8B354AB2FF8C} is Microsoft.Copilot_1.25121.60.0_x64__*
  HKLM\SOFTWARE\Classes\PackagedCom\ClassIndex\
  HKLM\SOFTWARE\Classes\PackagedCom\Package\Microsoft.Copilot_1.25121.60.0_x64__8wekyb3d8bbwe
  {CB3B0003-8088-4EDE-8769-8B354AB2FF8C} is CopilotNative.FileExplorerExtension.dll
  HKLM\SOFTWARE\Classes\PackagedCom\Package\Microsoft.Copilot_1.25121.60.0_x64__8wekyb3d8bbwe\Server\3
  */
var coll = AkmeMS.wmiInstancesOf("Win32_Process");
for (var en=new Enumerator(coll); !en.atEnd(); en.moveNext()) {
  var item = en.item();
  if (/^1184|2224|1324$/.test(item.ProcessId)) {
    WScript.Echo(item.ProcessId, item.Name, item.ParentProcessId, item.CommandLine);
  }
}
