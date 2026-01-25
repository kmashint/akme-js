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

if (!this.console)
  this.console = {
    log: function (a, b, c, d, e, f, g, h, i, j) {
      WScript.Echo(a, b, c, d, e, f, g, h, i, j);
    },
    debug: this.log,
    info: this.log,
    warn: this.log,
    error: this.log
  };

if (!this.AkmeMS)
  this.AkmeMS = {
    wbemFast: 16 | 32,

    fso: new ActiveXObject("Scripting.FileSystemObject"), // https://ss64.com/vb/filesystemobject.html
    net: new ActiveXObject("WScript.Network"), // https://ss64.com/vb/network.html
    sha: new ActiveXObject("Shell.Application"), // https://ss64.com/vb/shell.html
    wsh: new ActiveXObject("WScript.Shell"), // https://ss64.com/vb/shell.html

    // https://learn.microsoft.com/en-us/windows/win32/wmisdk/wmi-reference
    // https://learn.microsoft.com/en-us/windows/win32/wmisdk/creating-a-wmi-script
    wmi: new ActiveXObject("WbemScripting.SWbemLocator").ConnectServer(".", "root\\cimv2"),
    wmiInstancesOf: function (path) {
      return this.wmi.InstancesOf(path, this.wbemFast);
    },
    wmiExecQuery: function (qry) {
      return this.wmi.ExecQuery(qry, this.wbemFast);
    },

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
      2: "ERROR_FILE_NOT_FOUND",
      3: "ERROR_PATH_NOT_FOUND",
      4: "ERROR_TOO_MANY_OPEN_FILES",
      5: "ERROR_ACCESS_DENIED",
      8: "ERROR_NOT_ENOUGH_MEMORY",
      14: "ERROR_OUTOFMEMORY",
      15: "ERROR_INVALID_DRIVE",
      16: "ERROR_CURRENT_DIRECTORY",
      112: "ERROR_DISK_FULL",
      161: "ERROR_BAD_PATHNAME",
      183: "ERROR_ALREADY_EXISTS",
      223: "ERROR_FILE_TOO_LARGE",
      225: "ERROR_VIRUS_INFECTED",
      226: "ERROR_VIRUS_DELETED",
      258: "WAIT_TIMEOUT",
      267: "ERROR_DIRECTORY",
      329: "ERROR_OPERATION_IN_PROGRESS",
      331: "ERROR_TOO_MANY_DESCRIPTORS",
      336: "ERROR_DIRECTORY_NOT_SUPPORTED"
    }
  };

function getWinErrorName(code) {
  return AkmeMS.winErrorCodes[code] || "ERROR";
}

function regEnumKey(hive, subKey) {
  var reg = AkmeMS.reg;
  var hiveNum = AkmeMS.regHives[hive];
  var req = reg.Methods_("EnumKey").InParameters.SpawnInstance_();
  req.hDefKey = hiveNum;
  req.sSubKeyName = subKey;
  var res = reg.ExecMethod_("EnumKey", req);
  if (res.ReturnValue !== 0) {
    throw new Error(
      "StdRegProv::EnumKey: " +
        res.ReturnValue +
        ": " +
        getWinErrorName(res.ReturnValue) +
        ": " +
        subKey
    );
  }
  return typeof res.sNames === "unknown" ? res.sNames.toArray() : [];
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
    throw new Error(
      "StdRegProv::EnumValues: " +
        res.ReturnValue +
        ": " +
        getWinErrorName(res.ReturnValue) +
        ": " +
        subKey
    );
  }
  var result = [];
  if (typeof res.sNames === "unknown") {
    var ary = res.sNames.toArray();
    for (var i = 0; i < ary.length; i++) {
      result.push({ Name: ary[i] });
    }
  }
  if (typeof res.Types === "unknown") {
    var ary = res.Types.toArray();
    for (var i = 0; i < ary.length; i++) {
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
    throw new Error(
      "StdRegProv::GetStringValue: " +
        res.ReturnValue +
        ": " +
        getWinErrorName(res.ReturnValue) +
        ": " +
        subKey +
        "\\" +
        name
    );
  }
  return res.sValue;
}

function searchRegistry(hive, subKey, searchTerm, foundCallback) {
  var results = [];
  var term = searchTerm.toLowerCase();

  // Enumerate keys under the specified subKey
  var subKeyAry;
  try {
    subKeyAry = regEnumKey(hive, subKey);
  } catch (err) {
    subKeyAry = [];
    WScript.Echo(err.message);
  }

  for (var i = 0; i < subKeyAry.length; i++) {
    var currentKey = subKey ? subKey + "\\" + subKeyAry[i] : subKeyAry[i];
    if (
      currentKey.toLowerCase().indexOf(term) !== -1
    ) {
      foundCallback({ type: "Key", path: currentKey });
    }
    // Recursively search in the subkey
    searchRegistry(hive, currentKey, searchTerm, foundCallback);
  }

  // Enumerate values under the specified subKey
  var valuesAry;
  try {
    valuesAry = regEnumValues(hive, subKey);
  } catch (err) {
    valuesAry = [];
    WScript.Echo(err.message);
  }
  for (var j = 0; j < valuesAry.length; j++) {
    if (
      valuesAry[j].Name.toLowerCase().indexOf(term) !== -1
    ) {
      foundCallback({ type: "Value", path: subKey, name: valuesAry[j].Name });
    }
    // StdRegProv::getStringValue() is much faster than wsh.RegRead().
    if (valuesAry[j].Type === 1) {
      // 1=String
      var regValue = regGetValue(hive, subKey, valuesAry[j].Name);
      if (
        regValue &&
        regValue.toLowerCase().indexOf(term) !== -1
      ) {
        foundCallback({
          type: "Value",
          path: subKey,
          name: valuesAry[j].Name,
          value: regValue
        });
      }
    }
  }

  return results;
}

// Example usage
// searchRegistry("HKEY_CURRENT_USER", "", "CrossDevice", 
searchRegistry("HKEY_CURRENT_USER", "AppEvents\\EventLabels", "Beep", function foundCallback(item) {
  WScript.Echo(
    item.type +
      ": " +
      item.path +
      (item.name != null ? ": " + item.name : "") +
      (item.value != null ? ": " + item.value : "")
  );
});
