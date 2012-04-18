// 

akme.onLoad(function() {
	var xhr = akme.xhr.open("GET", "template/main.xhtml");
	xhr.onreadystatechange = function(ev) {
		var xmldom = akme.xhr.getResponseXML(xhr);
		akme.importElementsReplaceById(document, xmldom, function(ev){
			alert(xmldom)
		});
	};
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
