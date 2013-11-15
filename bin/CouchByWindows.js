if (!this.AkmeMS) this.AkmeMS = {
	fsoRead : 1,
	fsoWrite : 2,
	fsoAppend : 8,
	fsoWindowsFolder : 0,
	fsoSystemFolder : 1,
	fsoTemporaryFolder : 2,
	fsoDriveRemovable : 1,
	fsoDriveFixed : 2,
	fsoDriveNetwork : 3,
	fsoDriveCDROM : 4,
	fsoDriveRAMDisk : 5,
	fsoAttrNormal : 0,
	fsoAttrReadOnly : 1,
	fsoAttrHidden : 2,
	fsoAttrSystem : 4,
	fsoAttrVolume : 8,
	fsoAttrDirectory : 16,
	fsoAttrArchive : 32,
	fsoAttrAlias : 1024,
	fsoAttrCompressed : 2048,
	wbemFlagReturnWhenComplete : 0, // wbem or wmi
	wbemFlagReturnImmediately : 16,
	wbemFlagForwardOnly : 32,
	winHide : 0,
	winShow : 1,
	
	fso : new ActiveXObject("Scripting.FileSystemObject"),
	wsh : new ActiveXObject("WScript.Shell"),
	wmi : AkmeGetObject("winmgmts://./root/cimv2"),
	wmiInstancesOf : function(path) { return this.wmi.InstancesOf(path, this.wbemFlagReturnImmediately | this.wbemFlagForwardOnly); },
	wmiExecQuery : function(qry) { return this.wmi.ExecQuery(qry, this.wbemFlagReturnImmediately | this.wbemFlagForwardOnly); },

};

akme.xhr.open = function(method, url, async, user, pass) {
	var xhr = new ActiveXObject("Msxml2.ServerXMLHTTP.6.0");
  	if (user) xhr.open(method, url, async!=false, user, pass);
  	else xhr.open(method, url, async!=false);
  	xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
  	return xhr;
};

akme.xhr.callAsync = function(method, url, headers, content, /*function(headers,content)*/ callbackFnOrOb) {
	var xhr = new ActiveXObject("Msxml2.ServerXMLHTTP.6.0");
	this.callAsyncXHR(xhr, method, url, headers, content, callbackFnOrOb);
	return xhr;
};

akme.xhr.callAsyncXHR = function(/*XMLHttpRequest*/ xhr, method, url, headers, content, /*function(headers,content)*/ callbackFnOrOb) {
	var self = this; // closure
	xhr.open(method, url, true);
	xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
	for (var key in headers) {
		var name = self.formatHttpHeaderName(key);
		xhr.setRequestHeader(name, headers[key]);
		if (name != key) {
			headers[name] = headers[key];
			delete headers[key];
		}
	}
	if (headers && !(typeof content === 'string' || content instanceof String)) {
		var type = headers["Content-Type"];
		if (/json;|json$/.test(type)) content = akme.formatJSON(content);
		else if (/xml;|xml$/.test(type)) content = akme.formatXML(content);
	}
	xhr.onreadystatechange = function() {
		if (xhr.readyState !== 4) return;
		var headers = self.parseHeaders(xhr.getAllResponseHeaders());
		headers.status = self.getStatus(xhr);
		headers.statusText = xhr.statusText;
		var content, type = headers["Content-Type"];
		try {
			if (/json;|json$/.test(type)) content = self.getResponseJSON(xhr);
			else if (/xml;|xml$/.test(type)) content = self.getResponseXML(xhr);
			else content = xhr.responseText;
		}
		catch (er) { 
			headers.status = 500; 
			headers.statusText = String(er); 
			content = xhr.responseText; 
		}
		akme.handleEvent(callbackFnOrOb, headers, content);
		self = xhr = callbackFnOrOb = null; // closure cleanup
	};
	if (typeof content !== 'undefined') xhr.send(content);
	else xhr.send();
	return;
};


/**
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 **/
var Base64 = {
 	// private property
	_keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
 	// public method for encoding
	encode : function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
 		input = Base64._utf8_encode(input);
 		while (i < input.length) {
 			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
 			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
 			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
 			output = output +
			this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 		}
 		return output;
	},
 
	// public method for decoding
	decode : function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
 		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
 		while (i < input.length) {
			enc1 = this._keyStr.indexOf(input.charAt(i++));
			enc2 = this._keyStr.indexOf(input.charAt(i++));
			enc3 = this._keyStr.indexOf(input.charAt(i++));
			enc4 = this._keyStr.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
		output = Base64._utf8_decode(output);
		return output;
	},
 
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	},
 
	// private method for UTF-8 decoding
	_utf8_decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}
 
};

(function(self){
	var SLICE = Array.prototype.slice;
	
	akme.copy(self.console, {
		log : function() { this.write.apply(this,arguments); },
		write : function() { 
			var div = document.getElementById("log");
			div.appendChild(document.createTextNode(SLICE.call(arguments,0).join("\t")));
			div.appendChild(document.createElement("br"));
		}
	});
})(this);

window.addEventListener("DOMContentLoaded", doContent);
window.addEventListener("load", doLoad);

function doContent(ev) { 
	console.log("documentMode:"+document.documentMode);
	console.log("XMLHttpRequest:"+XMLHttpRequest);
	console.log("MSXML2.ServerXMLHTTP:"+(new ActiveXObject("MSXML2.ServerXMLHTTP") != null));
	console.log("JSON:"+JSON);
	for (var en = new Enumerator(AkmeMS.wmiInstancesOf("Win32_LogicalDisk")); !en.atEnd(); en.moveNext()) {
		var item = en.item();
		console.log(item.Name, item.Description); // key=DeviceID
	}
	var form = document.forms[0];
	akme.onEvent(form, "submit", doSubmit);
	
}

function doLoad(ev) {
}

function doSubmit(ev) {
	var form = ev.target;
	var params = {remote:null, user:null, pass:null};
	for (var key in params) { params[key] = form.elements[key].value; }
	params.remote = "https://"+ params.remote;
	console.log(params.remote);
	var headers = {"Authorization": "Basic "+ Base64.encode(params.user+":"+params.pass)};
	akme.xhr.callAsync("GET", params.remote, headers, null, getResult);
	function getResult(headers,content) {
		console.log(akme.formatJSON(headers));
	}
	
	var ins = AkmeMS.fso.OpenTextFile("CouchByWindows/_design/live.json", AkmeMS.fsoRead);
	try { while (!ins.AtEnd) {
		;
	} }
	finally { ins.Close(); }
	
}
