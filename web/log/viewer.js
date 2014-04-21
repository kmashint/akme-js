// console log/viewer.js

var	tridentPos = navigator.userAgent.indexOf(" Trident/"),
	isIE = tridentPos != -1,
	isIE9 = / Trident\/[45]\./.test(navigator.userAgent.substring(tridentPos,tridentPos+11));

window.addEventListener("DOMContentLoaded", function(ev){
	
}, false);

function findLines(elem) {
	var form = elem.form;
	var map = form.elements;
	var params = [
		"?findBtn=", encodeURIComponent(map["findBtn"].value), 
		"&date=", encodeURIComponent(map["date"].options[map["date"].selectedIndex].value),
		"&time=", encodeURIComponent(map["time"].value),
		"&user=", encodeURIComponent(map["user"].value)];
	var xhr = new XMLHttpRequest();
	xhr.open("GET", params.join(""));
	xhr.onreadystatechange = function(){ receive(xhr); };
	xhr.send();
	
	function receive(xhr) {
		if (xhr.readyState !== 4) return;
		if (!xhr.status == 200) console.warn(xhr.status, " "+params.join(""));
		var type = xhr.getResponseHeader("Content-Type"), content;
		if (/^application\/json/.test(type)) {
			//try { content = JSON.parse(xhr.responseText); }
			//catch (er) 
			{ content = xhr.responseText; }
		}
		else if (/^text\/plain/.test(type)) {
			content = xhr.responseText;
		}
		var div = document.getElementById("log");
		div.innerHTML = "";
		div.appendChild(document.createTextNode(content));
		if (map["replay"].checked) {
			var localStr = console.logLocal ? "Local" : "";
			var a = content.split("\n");
			for (var i=0; i<a.length; i++) if (a[i]) {
				var line = JSON.parse(a[i]);
				if (!line || !line[0]) continue;
				console["log"+localStr](JSON.stringify(line[0]));
				if (line[1]) for (var j=0; j<line[1].length; j++) {
					var item = line[1][j];
					if (item) {
						if (isIE) for (var k=1; k<item.length; k++) {
							if (typeof item[k]==="object") item[k] = JSON.stringify(item[k]);
						}
						if (isIE9) console[item[0]+localStr](item.slice(1));
						else console[item[0]+localStr].apply(console,item.slice(1));
					}
				}
			}
		}
	}
}