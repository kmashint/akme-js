// 

akme.onLoad(function() {
	console.logEnabled = true;
	var xhr = akme.xhr.open("GET", "template/main.xhtml");
	xhr.onreadystatechange = function(ev) {
		if (xhr.readyState !== 4) return; 
		var xmldom = akme.xhr.getResponseXML(xhr);
		akme.importElementsReplaceById(document, xmldom, function(ev){
			console.info("xmldom ", xmldom)
		});
	};
	xhr.send();
});

if (!akme.core.Template) akme.core.Template = akme.extend(akme.copyAll(function(id) {
		this.id = id || "templateScript";
		var script = document.getElementById(this.id);
		if (script && script.onload) script.onload();
	}, {name: "akme.core.Template"}), 
	{
	}
);
