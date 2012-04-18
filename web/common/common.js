// 

akme.onLoad(function() {
	console.logEnabled = true;
	var xhr = akme.xhr.open("GET", "template/main.xhtml");
	xhr.onreadystatechange = function(ev) {
		if (xhr.readyState !== 4) return; 
		var xmldom = akme.xhr.getResponseXML(xhr);
		akme.importElementsReplaceById(document, xmldom, function(ev){
			alert(xmldom)
		});
	};
	xhr.send();
});


(function($,$$){

	var CLASS = "akme.core.Template";
	
	var self = akme.extend(function(onload) {
		this.id = "templateScript";
		this.onload = onload;
		$$.EventSource.apply(this);
	},{
	});
	self.name = CLASS;
	$$.Template = self;

})(akme,akme.core);
