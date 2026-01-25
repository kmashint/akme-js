// winreg.js for Microsoft JScript
// Use: cscript //nologo winreg.js
// See: cscript /?
// https://github.com/MicrosoftDocs/win32/tree/docs/desktop-src/WmiSdk
// https://learn.microsoft.com/en-us/previous-versions/windows/desktop/regprov/stdregprov
// https://stackoverflow.com/questions/32295918/iterate-over-registry-keys
// https://gist.github.com/ukoloff/ea6c23d1572fb5b50e97d6683d0cb13f
// https://github.com/MicrosoftDocs/win32/blob/8627cd1fd2c0534b4ac7ab0c99a3c6c2c29c3a85/desktop-src/WmiSdk/wmi-architecture.md?plain=1#L37
// https://github.com/MicrosoftDocs/win32/blob/8627cd1fd2c0534b4ac7ab0c99a3c6c2c29c3a85/desktop-src/WmiSdk/obtaining-registry-data.md?plain=1#L2
// https://github.com/MicrosoftDocs/win32/blob/8627cd1fd2c0534b4ac7ab0c99a3c6c2c29c3a85/desktop-src/WmiSdk/modifying-the-system-registry.md?plain=1#L12

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
	wmiExecQuery : function(qry) { return this.wmi.ExecQuery(qry, this.wbemFast); },

  reg: new ActiveXObject("WbemScripting.SWbemLocator").ConnectServer(".", "root\\default").Get("StdRegProv"),
  regHives: {
    HKEY_CLASSES_ROOT: 0x80000000,
    HKEY_CURRENT_USER: 0x80000001,
    HKEY_LOCAL_MACHINE: 0x80000002,
    HKEY_USERS: 0x80000003,
    HKEY_CURRENT_CONFIG: 0x80000005
  },

  // https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-
  winErrorCodes: {
    161: "ERROR_BAD_PATHNAME"
  }
};

function getWinErrorName(code) {
  return AkmeMS.winErrorCodes[code] || "-";
}

function regEnumKey(hive, subKey) {
  var reg = AkmeMS.reg;
  var hiveNum = AkmeMS.regHives[hive];
  var req = reg.Methods_("EnumKey").InParameters.SpawnInstance_();
  req.hDefKey = hiveNum;
  req.sSubKeyName = subKey;
  var res = reg.ExecMethod_("EnumKey", req);
  if (res.ReturnValue !== 0) {
    throw new Error("StdRegProv::EnumKey: " +
      res.ReturnValue + ": " +
      getWinErrorName(res.ReturnValue) + ": " +
      subKey);
  }
  return typeof res.sNames === 'unknown' ? res.sNames.toArray() : [];
}

function regEnumValues(hive, subKey) {
  var reg = AkmeMS.reg;
  var hiveNum = AkmeMS.regHives[hive];
  var req = reg.Methods_("EnumValues").InParameters.SpawnInstance_();
  req.hDefKey = hiveNum;
  req.sSubKeyName = subKey;
  var res;
  res = reg.ExecMethod_("EnumValues", req);
  if (res.ReturnValue !== 0) {
    throw new Error("StdRegProv::EnumValues: " +
      res.ReturnValue + ": " +
      getWinErrorName(res.ReturnValue) + ": " +
      subKey);
  }
  var result = [];
  if (typeof res.sNames === 'unknown') {
    var ary = res.sNames.toArray();
    for (var i=0; i<ary.length; i++) {
      result.push({ Name: ary[i] });
    }
  }
  if (typeof res.Types === 'unknown') {
    var ary = res.Types.toArray();
    for (var i=0; i<ary.length; i++) {
      result[i].Type = ary[i];
    }
  }
  return result;
}

function regGetValue(hive, subKey, name) {
  var reg = AkmeMS.reg;
  var hiveNum = AkmeMS.regHives[hive];
  var req = reg.Methods_("GetStringValue").InParameters.SpawnInstance_();
  req.hDefKey = hiveNum;
  req.sSubKeyName = subKey;
  req.sValueName = name;
  var res = reg.ExecMethod_("GetStringValue", req);
  if (res.ReturnValue !== 0) {
    throw new Error("StdRegProv::GetStringValue: " +
      res.ReturnValue + ": " +
      getWinErrorName(res.ReturnValue) + ": " +
      subKey +"\\"+ name);
  }
  return res.sValue;
}

function searchRegistry(hive, subKey, searchTerm) {
    var results = [];

    // Enumerate keys under the specified subKey
    var subKeyAry;
    try {
      subKeyAry = regEnumKey(hive, subKey);
    }
    catch (err) {
      subKeyAry = [];
      WScript.Echo(err.message);
    }

    for (var i = 0; i < subKeyAry.length; i++) {
        var currentKey = subKey ? subKey + "\\" + subKeyAry[i] : subKeyAry[i];
        if (currentKey.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 || results.length === 0) {
            results.push({ type: "Key", path: currentKey });
        }
        // Recursively search in the subkey
        results = results.concat(searchRegistry(hive, currentKey, searchTerm));
    }

    // Enumerate values under the specified subKey
    var valuesAry;
    try {
      valuesAry = regEnumValues(hive, subKey);
    }
    catch (err) {
      valuesAry = [];
      WScript.Echo(err.message);
    }
    for (var j = 0; j < valuesAry.length; j++) {
      if (valuesAry[j].Name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
        results.push({ type: "Value", path: subKey, name: valuesAry[j].Name });
      }
      // StdRegProv::getStringValue() is much faster than wsh.RegRead().
      if (valuesAry[j].Type === 1) { // 1=String
        var regValue = regGetValue(hive, subKey, valuesAry[j].Name);
        if (regValue && regValue.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) {
          results.push({ type: "Value", path: subKey, name: valuesAry[j].Name });
        }
      }
    }

    return results;
}

// Example usage
var searchResults = searchRegistry("HKEY_CURRENT_USER", "AppEvents\\EventLabels", "Beep");
for (var i = 0; i < searchResults.length; i++) {
    WScript.Echo(searchResults[i].type + ": " + searchResults[i].path +
                 (searchResults[i].name ? (" - " + searchResults[i].name) : ""));
}
