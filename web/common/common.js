// 

akme.onLoad(function() {
	console.logEnabled = true;
	akme.core.Template.load("template/main.xhtml");
	// main.xhtml then should have a new akme.core.Template("templateScript", function() { ... });
});

if (!akme.core.Template) akme.core.Template = akme.extend(akme.copyAll(function(id,callback) {
		this.id = id || "templateScript";
		this.callback = callback;
		akme.getContext().set(this.id, this);
		var script = document.getElementById(this.id);
		if (script && script.onload) script.onload({type:"load", target:script});
	}, 
	{ // .constructor function class additions
		name: "akme.core.Template",
		load: function(name) {
			var xhr = akme.xhr.open("GET", name);
			xhr.onreadystatechange = function(ev) {
				if (xhr.readyState !== 4) return; 
				var xmldom = akme.xhr.getResponseXML(xhr);
				akme.importElementsReplaceById(document, xmldom, function(){
					// Called after all scripts have loaded.
					// new akme.core.Template().setContext(akme.getContext()) ensures something is run.
					// and puts the current templateScript in the Context.
					console.log(789)
					var template = akme.getContext().get("templateScript");
					template.callback({type:"load", target:template});
				});
			};
			xhr.send();
		}
	}), 
	{ // .prototype super-static
	}
);
