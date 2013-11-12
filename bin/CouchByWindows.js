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
	winHide : 0,
	winShow : 1,
	wbemFlagReturnWhenComplete : 0, // wbem or wmi
	wbemFlagReturnImmediately : 16,
	wbemFlagForwardOnly : 32,
	
	fso : new ActiveXObject("Scripting.FileSystemObject"),
	wsh : new ActiveXObject("WScript.Shell"),
	wmi : AkmeGetObject("winmgmts://./root/cimv2"),
	wmiInstancesOf : function(path) { return this.wmi.InstancesOf(path, this.wbemFlagReturnImmediately | this.wbemFlagForwardOnly); }
};

(function(self){
	var SLICE = Array.prototype.slice;
	
	if (!self.console) self.console = {
		log : function() { this.write.apply(this,arguments); },
		write : function() { 
			var div = document.getElementById("log");
			div.appendChild(document.createTextNode(SLICE.call(arguments,0).join("\t")));
			div.appendChild(document.createElement("br"));
		}
	};
})(this);

if (window.addEventListener) window.addEventListener("load", doLoad);
else window.attachEvent("on"+"load", doLoad);

function doLoad(ev) {
	console.log("documentMode:"+document.documentMode);
	console.log("XMLHttpRequest:"+XMLHttpRequest);
	console.log("MSXML2.ServerXMLHTTP:"+(new ActiveXObject("MSXML2.ServerXMLHTTP") != null));
	console.log("JSON:"+JSON);
	for (var en = new Enumerator(AkmeMS.wmiInstancesOf("Win32_LogicalDisk")); !en.atEnd(); en.moveNext()) {
		var item = en.item();
		console.log(item.Name, item.Description); // DeviceID
	}
}