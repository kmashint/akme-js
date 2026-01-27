// https://github.com/MicrosoftDocs/win32/tree/docs/desktop-src/WmiSdk
// https://learn.microsoft.com/en-us/previous-versions/windows/desktop/regprov/stdregprov
// https://stackoverflow.com/questions/32295918/iterate-over-registry-keys
// https://gist.github.com/ukoloff/ea6c23d1572fb5b50e97d6683d0cb13f
// https://github.com/MicrosoftDocs/win32/blob/8627cd1fd2c0534b4ac7ab0c99a3c6c2c29c3a85/desktop-src/WmiSdk/wmi-architecture.md?plain=1#L37
// https://github.com/MicrosoftDocs/win32/blob/8627cd1fd2c0534b4ac7ab0c99a3c6c2c29c3a85/desktop-src/WmiSdk/obtaining-registry-data.md?plain=1#L2
// https://github.com/MicrosoftDocs/win32/blob/8627cd1fd2c0534b4ac7ab0c99a3c6c2c29c3a85/desktop-src/WmiSdk/modifying-the-system-registry.md?plain=1#L12

function formatWinError(code, message) {
  return code + ": " +
    (AkmeMS.winErrorCodes[code] || "ERROR") +
    (message != null ? ": " + message : "");
}

function regEnumKey(hive, subKey) {
  var reg = AkmeMS.reg;
  var hiveNum = AkmeMS.regHives[hive];
  var req = reg.Methods_("EnumKey").InParameters.SpawnInstance_();
  req.hDefKey = hiveNum;
  req.sSubKeyName = subKey;
  var res = reg.ExecMethod_("EnumKey", req);
  if (res.ReturnValue !== 0) {
    throw new Error("StdRegProv::EnumKey: " + formatWinError(res.ReturnValue, subKey));
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
    throw new Error("StdRegProv::EnumValues: " + formatWinError(res.ReturnValue, subKey));
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
    throw new Error("StdRegProv::GetStringValue: " + formatWinError(res.ReturnValue, subKey + "\\" + name));
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

function regFoundCallback(item) {
  WScript.Echo(
    item.type +
      ": " +
      item.path +
      (item.name != null ? ": " + item.name : "") +
      (item.value != null ? ": " + item.value : "")
  );
}
