/*
  process-win.js
  Find Windows Process.
  cscript //b //nologo process-win.js
  Note Jsign for Signing jar, dll, exe, msi, jscript and more files.
    https://github.com/ebourg/jsign
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
  /Processid:{3EB3C877-1F16-487C-9050-104DBCD66683} is WinInetCacheServer, Wininet Cache task object, wininet.dll
  HKLM\SOFTWARE\Classes\AppID\
  HKLM\SOFTWARE\Classes\PackagedCom\ClassIndex\
  HKLM\SOFTWARE\Classes\PackagedCom\Package\Microsoft.Copilot_1.25121.60.0_x64__8wekyb3d8bbwe
  {CB3B0003-8088-4EDE-8769-8B354AB2FF8C} is CopilotNative.FileExplorerExtension.dll
  HKLM\SOFTWARE\Classes\PackagedCom\Package\Microsoft.Copilot_1.25121.60.0_x64__8wekyb3d8bbwe\Server\3
  */
var coll = AkmeMS.wmiInstancesOf("Win32_Process");
for (var en=new Enumerator(coll); !en.atEnd(); en.moveNext()) {
  var item = en.item();
  if (/svchost.exe -k DcomLaunch -p|[Dd]ll[Hh]ost.exe \/[Pp]rocess[Ii]d:/.test(item.CommandLine)) {
    WScript.Echo(item.ProcessId, item.Name, item.ParentProcessId, item.CommandLine);
  }
}
