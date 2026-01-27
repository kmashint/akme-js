// Encoder/Decoder for Url and Property encodings for maps of name/value pairs.
//
function EncodedMap() {
  this.Map = {};
  this.Exists = function(key) { return (this.Map[key]) != "undefined" };
  this.Add = function(key,val) { this.Map[key] = val; };
  this.AddAll = function(map) { for (var key in map) { this.Map[key] = map[key]; } };
  this.AddAllKeysValues = function(keys,values) { for (var key in keys) { this.Map[key] = values[key]; } };
  this.Remove = function(key) { var r = this.Map[key]; delete this.Map[key]; return r; };
  this.RemoveAll = function() { for (var key in this.Map) delete this.Map[key]; };

  this.UrlEncode = function() { // return String
    var ary1 = [], ary2 = new Array(2), idx1;
    idx1 = 0;
    for (var key in this.Map) {
      ary2[0] = key ; ary2[1] = this.Map[key]; //: debug( ary2(0) &" "& ary2(1) )
      if (ary2[1] == "undefined" || ary2[1] == "unknown") { ary2[1] = ""; }
      for (var i=0; i<ary2.length; i++) {
        ary2[i] = encodeURIComponent(ary2[i]).replace(/\+/g,"%2B");
      }
      ary1[idx1] = ary2[0] +"="+ ary2[1];
      idx1++;
    }
    return ary1.join("&");
  };

  this.UrlDecode = function(paramStr) {
    var str, ary1, ary2;
    str = String(paramStr).replace(/\+/g," ");
    ary1 = str.split("&");
    for (var j=0; j<ary1.length; j++) {
      ary2 = ary1[j].split("=", 2);
      for (var i=0; i<ary2.length; i++) {
        ary2[i] = decodeURIComponent(ary2[i]);
      }
      this.Map[ary2[0]] = ary2[1];
    }
  };

  this.PropertyEncode = function() { // return String
    var ary1 = new Array(this.Map.length), ary2 = new Array(2), idx1;
    idx1 = 0;
    for (var key in this.Map) {
      ary2[0] = key ; ary2[1] = this.Map[key];
      if (ary2[1] == "undefined" || ary2[1] == "unknown") { ary2[1] = ""; }
      for (var i=0; i<ary2.length; i++) {
        ary2[i] = ary2[i].replace("\n", "\\\n");
      }
      ary1[idx1] = ary2[0] +"="+ ary2[1];
      idx1++;
    }
    return ary1.join("\r\n");
  };

  this.PropertyDecode = function(paramStr) {
    var str, ary1, ary2;
    str = String(paramStr);
    this.Map = [];
    ary1 = str.split("\r\n");
    for (var item in ary1) {
      ary2 = item.split("=", 2);
      this.Map[ary2[0]] = ary2[1].replace("\\\n","\n");
    }
  };

  return this;
}


// IniFile manipulation using FileSystemObject text lines.
// The FileName is to set/get the INI file name.
// The Map is a map of "[section]item" keys to related values.
// The private lnList_ remembers the order of lines including comments.
// The private newMap_ remembers newly added elements to add to the stream when saving.
function AkmeIniFile() {

  // private
  this.fs_ = AkmeMS.fso;
  this.lnList_ = null;
  this.newMap_ = {};

  // public
  this.FileName = "";
  this.Map = {};

  this.GetString = function ( sectionName, keyName ) {
    if (this.lnList_ === null) {
      this.LoadMap();
    }
    var infoKey = "["+ sectionName +"]"+ keyName
    if (this.Map[infoKey]) {
      return this.Map[infoKey];
    } else {
      return null;
    }
	};

  this.SetString = function( sectionName, keyName, value ) {
    var infoKey = "["+ sectionName +"]"+ keyName;
    if (this.lnList_ === null) {
      this.LoadMap();
    }
    if (!this.Map[infoKey] && !this.newMap_[infoKey]) {
      this.newMap_[infoKey] = true;
      var sec, found;
      sec = "["+ sectionName +"]";
      found = false;
      for (var i=0; i<this.lnList_.length; i++) {
        if (this.lnList_[i].indexOf(sec) != 0) continue;
        found = true;
        break;
      }
      if (!found) {
        this.lnList_.splice(this.lnList_.length, 0, "", sec);
      }
    }
    this.Map[infoKey] = value;
  };

  this.ReadString = function( sectionName, keyName, defValue ) { // Return As String
    var result = this.GetString( sectionName, keyName )
    if (!(result > "")) result = defValue;
    return result;
  };

  this.WriteString = function( sectionName, keyName, value ) {
    this.SetString( sectionName, keyName, value );
    this.SaveMap();
  };

  this.LoadMap = function() {
    if (!this.fs_.FileExists(this.FileName)) {
      AkmeMS.Debug("AkmeIniFile.LoadMap() cannot find "+ this.FileName);
      return;
    }
    var ts, str, c, pos, sec, key, infoKey, oldCount;
		oldCount = 0;
		for (var key in this.Map) { oldCount = 1 ; break; }
    this.lnList_ = [];
    this.newMap_ = {};
    ts = this.fs_.OpenTextFile(this.FileName, 1);
    while (!ts.AtEndOfStream) {
      key = null;
      str = ts.ReadLine();
      c = str.charAt(0);
      if (c === "[") {
        pos = str.lastIndexOf("]");
        sec = str.substring(1,pos);
      } else if ((c >= "0" && c <= "9") || (c >= "A" && c <= "Z") || (c >= "a" && c <= "z")) {
        pos = str.indexOf("=");
        if (pos >= 0) {
          key = str.substring(0,pos).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
          infoKey = "["+ sec +"]"+ key;
          this.newMap_[infoKey] = false;
          if (oldCount === 0 || typeof(this.Map[infoKey]) != 'undefined') {
            this.Map[infoKey] = str.substring(pos+1).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
          }
        }
      }
      this.lnList_[this.lnList_.length] = str;
    }
    ts.Close();
    ts = null;
    for (var key in this.Map) {
      if (typeof(this.newMap_[key]) === 'undefined') this.newMap_[key] = true;
    }
  };

  this.SaveMap = function() {
    if (!this.fs_.FileExists(this.FileName)) {
      AkmeMS.Debug("AkmeIniFile.SaveMap() cannot find "+ this.FileName);
      return;
    }
    var ts, str, c, pos, sec, key, i, j, infoKey;
    ts = this.fs_.OpenTextFile(this.FileName, 2);
    // Using a while loop since the length may change.
    i = 0;
    while (i < this.lnList_.length) {
      key = null;
      str = this.lnList_[i];
      c = (str) ? str.charAt(0): "";
      if (c === "[") {
        pos = str.lastIndexOf("]");
        sec = str.substring(1,pos);
        j = 1;
        for (var infoKey in this.newMap_) {
          if (this.newMap_[infoKey] && str.lastIndexOf(infoKey.substring(0,pos+1), pos+1) === 0) {
            this.lnList_.splice(i+j, 0, infoKey.substring(pos+1) +"=");
            j = j + 1;
          }
        }
      } else if ((c >= "0" && c <= "9") || (c >= "A" && c <= "Z") || (c >= "a" && c <= "z")) {
        pos = str.indexOf("=");
        if (pos >= 0) {
          key = str.substring(0,pos).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        }
      }
      infoKey = "";
      if (key != null) {
        infoKey = "["+ sec +"]"+ key;
        if (this.newMap_[infoKey]) {
          // It can only be new once, ignore duplicates.
          if (this.newMap_[infoKey]) this.newMap_[infoKey] = false;
        }
        if (typeof(this.Map[infoKey]) != 'undefined') {
          str = key +"="+ this.Map[infoKey];
          this.lnList_[i] = str;
        } else {
          infoKey = null;
        }
      }
      if (infoKey != null) ts.WriteLine(str);
      i = i + 1;
    }
    ts.Close();
    ts = null;
    this.newMap_ = {};
  };
}
