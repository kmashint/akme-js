// 

akme.onLoad(function() {
	console.logEnabled = true;
	akme.core.Template.load("template/main.xhtml", null, function(){ console.log("Template.load"); });
	// main.xhtml then should have a new akme.core.Template("templateScript", function() { ... });
});

if (!akme.core.Template) akme.core.Template = akme.extendClass(akme.copyAll(function(id,callback) {
		this.id = id || "templateScript";
		this.callback = callback;
		akme.getContext().set(this.id, this);
		var script = document.getElementById(this.id);
		if (script && script.onload) script.onload({type:"load", target:script});
	}, 
	{ // .constructor function class additions
		CLASS: "akme.core.Template",
		load: function(name,scriptId,callback) {
			var xhr = akme.xhr.open("GET", name);
			xhr.onreadystatechange = function(ev) {
				if (xhr.readyState !== 4) return; 
				var xmldom = akme.xhr.getResponseXML(xhr);
				akme.importElementsReplaceById(document, xmldom, function(){
					// Called after all scripts have loaded.
					// new akme.core.Template("templateScript", function(){}) can be used in a template xhtml.
					//if (console.logEnabled) console.log(789)
					var template = akme.getContext().get(scriptId || "templateScript");
					if (template) {
						if (template.callback) template.callback({type:"load", target:template});
						if (callback) callback({type:"load", target:template});
					} else {
						template = new akme.core.Template(scriptId || "templateScript", callback);
						if (callback) template.callback({type:"load", target:template});
					}
				});
			};
			xhr.send();
		}
	}), 
	{ // .prototype super-static
	}
);
