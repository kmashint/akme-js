// Add more to the akme object.

akme.copy(akme, {

	/**
	 * Find parent elements by tagName and className.
	 * This is the reverse of getElementsByTagNameClassName, but because it is looking up 
	 * the tree, it will only return a single element.
	 * 
	 * @param node to start searching from (excluded from search).
	 * @param tagName to search for.
	 * @param className As simple or multiple space-delimited classNames that must be matched.
	 */
	getParentElementByTagNameClassName : function(node, tagName, className) {
		if(!node || !tagName || !className) return null;
		var tagNameUpper = tagName.toUpperCase();
		var currentNode = node;
		var classAry = className.split(" ");
		while (currentNode 
				&& currentNode.parentNode
				&& currentNode != currentNode.parentNode) {
			currentNode = currentNode.parentNode;
			if(currentNode.nodeName == tagNameUpper) {
				var tagClassName = currentNode.className;
				if (!tagClassName) continue;
				for (var j=0 ; j<classAry.length ; j++) {
					var className = classAry[j];
					var pos = tagClassName.indexOf(className);
					if (pos == -1) continue;
					if ((pos == 0 || " " == tagClassName.charAt(pos-1)) 
							&& (pos+className.length == tagClassName.length || " " == tagClassName.charAt(pos+className.length))) {
						return currentNode;
					}
				}
			}
		}
	},
	
	/**
	 * Toggle a class on an element.
	 * 
	 * @param element to toggle the class on.
	 * @param c the class name to toggle.
	 */
	toggleClass : function(element, c) {
		var className = element.className;
		var classAry = [].concat(className.split(" "));
		var newClassAry = [];
		for(var i=0 ; i<classAry.length ; i++) {
			if(c != classAry[i]) {
				newClassAry[newClassAry.length]=(classAry[i]);
			}
		}
		if(newClassAry.length == classAry.length) {
			// nothing removed, must be adding
			newClassAry[newClassAry.length]=(c);
		} 
		element.className = newClassAry.join(" ");
	},
	
	/**
	 * Check whether an element has a class or not.
	 * 
	 * @param element to check.
	 * @param c the class name to check for.
	 */
	hasClass : function(element, c) {
		var className = element.className;
		var classAry = [].concat(className.split(" "));
		for(var i=0 ; i<classAry.length ; i++) {
			if(c == classAry[i]) {
				return true;
			}
		}
		return false;
	},
	
	xml2js : function(dom) {
		var obj = {};
		if (dom.nodeType == 1) { // element
			if (dom.attributes.length > 0) {
				for (var j = 0; j < dom.attributes.length; j++) {
					obj[dom.attributes[j].nodeName] = dom.attributes[j].nodeValue;
				}
			}
		} else if (dom.nodeType == 3) { // text
			obj["$"] = dom.nodeValue;
		}
		if (dom.hasChildNodes()) { // children
			var name, a;
			for (var i = 0; i < dom.childNodes.length; i++) {
				name = dom.childNodes[i].nodeName;
				if (typeof(obj[name]) == 'undefined') {
					obj[name] = this.xml2js(dom.childNodes[i]);
				} else {
					a = obj[name];
					if (typeof(a.length) == 'undefined') a = [a];
					if (typeof(a) == 'object') a[a.length]=(this.xml2js(dom.childNodes[i]));
					obj[name] = a;
				}
			}
		}
		return obj;
	},
	
	xml2jsReviver : function(key, value) {
		if (typeof value === 'string' && (
				key.indexOf("Date", key.length-4) != -1 ||
				key.indexOf("Datetime", key.length-8) != -1 ||
				key.indexOf("DateTime", key.length-8) != -1) ) {
		    var a = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z?$/.exec(value);
		    if (a && value.charAt(value.length-1)==='Z') return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]));
		    else if (a) return new Date(+a[1], +a[2] - 1, +a[3], +a[4], +a[5], +a[6]);
		}
	    return value;
	},
	
	/**
	 * Simple timer to check page performance.
	 * Use akme.timer.add("a"); ... akme.timer.add("b"); ... akme.timer.add("c");
	 * and then akme.timer.appendInfoToElement(document.body);
	 */
	timer : {
		items : [],
		clear : function () { this.items = []; }, 
		add : function (name) { this.items.push([name,new Date()]); },
		getName : function (idx) { return this.items[idx][0]; },
		getValue : function (idx) { return this.items[idx][1]; },
		getDiff : function (idx) { return this.items[idx][1]-this.items[idx-1][1]; },
		getDiffOverall : function () { return this.items[this.items.length-1][1]-this.items[0][1]; },
		appendInfoToElement : function (elem) {
			var items = this.items;
			var a = [];
			for (var i=0; i<items.length; i++) a.push(
				(items[i][0] ? items[i][0]+" : " : "") + (i==0 ? items[i][1] : items[i][1]-items[i-1][1])
				);
			elem.appendChild(document.createTextNode("{"+a.join(", ")+"}")); 
		}
	}
	
});


if (!akme.form) akme.form = {
	getFormElements : function (outer) {
		var a = [];
		var names = ["button","input","select","textarea"];
		for (var i=0; i<names.length; i++) {
			var tags = outer.getElementsByTagName(names[i]);
			for (var j=0; j<tags.length; j++) a[a.length]=(tags[j]);
		}
		return a;
	},
	
	cloneFormElementValues : function (fromOuter, toOuter) {
		var fromElems = this.getFormElements(fromOuter);
		var toElems = this.getFormElements(toOuter);
		for (var i=0; i<fromElems.length && i<toElems.length; i++) {
			var fromElem = fromElems[i];
			var toElem = toElems[i];
			if (fromElem.checked) toElem.checked = true;
			else if (fromElem.selectedIndex >= -1) {
				toElem.selectedIndex = fromElem.selectedIndex;
				if (fromElem.multiple) for (var j=0; j<fromElem.options.length; j++) {
					if (fromElem.options[j].selected) toElem.options[j].selected = true;
				}
			}
		  	else if (fromElem.value) toElem.value = fromElem.value;
		 }
	},
	
	/**
	 * Get the current value of the element, works for select, checkbox, radio.
	 
	getValue : function (elem) {
		var a = elem instanceof NodeList ? elem : [elem];
		var node = a[0].nodeName.toLowerCase();
		var type = a[0].type;
		if ("select"===node) {
			return elem.options[selectedIndex].value;
		} else if ("checkbox"===type || "radio"===type) {
			if (elem instanceof NodeList) for (var i=0; i<a.length; i++) {
				if (a[i].checked) return a[i].value;
			}
			return a[0].value;
		} else {
			return elem.value;
		}
	},
	
	/**
	 * Set the current value of the element to the given value, works for select, checkbox, radio.
	 
	setValue : function (elem, value) {
		var a = elem instanceof NodeList ? elem : [elem];
		var node = a[0].nodeName.toLowerCase();
		var type = a[0].type;
		if ("select"===node) {
			for (var i=0; i<elem.options.length; i++) {
				var optn = elem.options[i];
				optn.selected = (optn.value == value);
				if (optn.selected) elem.selectedIndex = i;
			}
		} else if ("checkbox"===type || "radio"===type) {
			for (var i=0; i<elem.options.length; i++) {
				var optn = elem.options[i];
				optn.checked = (optn.value == value);
			}
		} else {
			elem.value = value;
		}
	}, */
	
	getValue : function (elem) {
		var elem0 = elem instanceof NodeList ? elem[0] : elem;
		var nodeName = elem0.nodeName.toLowerCase();
		if ("select"==nodeName) {
			return elem.options[elem.selectedIndex].value;
		} 
		else if ("input"==nodeName && ("radio"==elem0.type || "checkbox"==elem0.type)) {
			if ("length" in elem0) {
				for (var i=0; i<elem0.length; i++) if (elem0[i].checked) return elem0[i].value;
				return "";
			}
			return elem.checked ? elem.value : "";
		}
		else return elem.value;
	},
	
	setValue : function (elem, value) {
		var elem0 = elem instanceof NodeList ? elem[0] : elem;
		var nodeName = elem0.nodeName.toLowerCase();
		if ("select"==nodeName) {
			for (var i=0; i<elem.options.length; i++) {
				var optn = elem.options[i];
				optn.selected = (optn.value == value);
				if (optn.selected) elem.selectedIndex = i;
			}
		}
		else if ("input"==nodeName && ("radio"==elem0.type || "checkbox"==elem0.type)) {
			if ("length" in elem0) {
				for (var i=0; i<elem0.length; i++) {
					var item = elem0[i];
					item.checked = (value == item.value);
				}
			} 
			else elem.checked = (value == elem.value);
		}
		else elem.value = value;
	},

	/** @deprecated - use setValue instead. */
	setChecked : function (elem, value) {
		this.setValue(elem, value);
	},

	/** @deprecated - use setValue instead. */
	setSelected : function (elem, value) {
		this.setValue(elem, value);
	},
	
	/**
	 * Get values from the form into a map, optionally given, but only those with a non-empty name.
	 * Will make arrays under the name for repeating elements as is practice with web form submissions.
	 * @returns the given or a new map ({} object). 
	 
	getIntoMap : function (form, map) {
		if (!map) map = {}; 
		for (var i=0; i<form.elements.length; i++) {
			var elem = form.elements[i];
			if (!elem.name) continue;
			var a = map[elem.name];
			var v = this.getValue(elem);
			if (elem.name in map) {
				if (a instanceof Array) a[a.length] = (v);
				else map[elem.name] = [v];
			} 
			else map[elem.name] = v;
		}
		return map;
	},
	
	/**
	 * Set values in the form from the given map.
	 
	setFromMap : function (form, map) {
		for (var key in map) {
			var elem = form.elements[key];
			if (!elem) continue;
			var v = map[key];
			if (elem instanceof NodeList) for (var i=0; i<v.length && i<elem.length; i++) {
				this.setValue(elem[i], v[i]);
			} else {
				this.setValue(elem, v);
			}
		}
	},
	*/
	

	/** 
	 * Get form element values into the given map or a new {} if map not given, handling repeating names as an array like Servlet API.
	 * Will NOT copy elements with an empty name.
	 */
	getIntoMap : function (form, map) {
		map = map || {};
		for (var i=0; i<form.elements.length; i++) {
			var elem = form.elements[i];
			if (!("name" in elem) || elem.name.length === 0) continue;
			var value = this.getValue(elem);
			var j = -1;
			
			if (elem.name in map) {
				var item = map[elem.name];
				if (item instanceof Array) {j = item.length; item[item.length] = value;}
				else map[elem.name] = [item, value];
			}
			else map[elem.name] = value;
			
			if (console.logEnabled) console.log("get ", form.name, (j!=-1 ? elem.name+"["+i+"]" : elem.name), value);
		}
		return map;
	},

	/** 
	 * Set form element values from the given map, handling repeating names as an array like Servlet API.
	 */
	setFromMap : function (form, map) {
		for (var key in map) {
			var elem = form.elements[key];
			if (!elem) continue;
			var value = map[key];
			var wasAry = (value instanceof Array);
			if (!wasAry) value = [value];
			if (!(elem instanceof NodeList)) elem = [elem];
			for (var i=0; i<value.length && i<elem.length; i++) {
				this.setValue(elem[i], value[i]);
				if (console.logEnabled) console.log("set ", form.name, 
						wasAry ? elem[i].name+"["+i+"]" : elem.name, 
						wasAry ? elem[i].value : elem.value);
			}
		}
		return form;
	}

};


// TODO: encapsulate with constructor/destructor.
akme.selectHelper = akme.selectHelper || {
	timeout : 1500,
	timestamp : 0,
	text : "",
	elem : null,
	focus : function(elem, evt) {
		this.text = "";
		this.elem = elem;
		this.timestamp = 0;
		return true;
	},
	keypress : function(evnt) {
		if (!evnt) evnt = window.event;
		if (!evnt) return false;
		var elem = (evnt.target) ? evnt.target : evnt.srcElement;
		if (!elem) return false;
		var uc = evnt.keyCode ? evnt.keyCode : evnt.which;
		var now = new Date().getTime();
		if (this.timestamp == 0) {
			this.timestamp = now;
		} else if (this.elem !== elem || now-this.timestamp > this.timeout) {
			this.text = "";
			this.timestamp = now;
		}
		this.elem = elem;
		if ((uc == 32 || uc >= 48) && !String.fromCharCode(uc).match(akme.PRINTABLE_EXCLUDE_REGEXP)) {
			if (uc != 32) this.text += String.fromCharCode(uc);
			this.find(elem);
			if (evnt.cancelable) evnt.preventDefault();
			if (evnt.bubbles) evnt.stopPropagation();
			return false;
		} else {
			this.text = "";
			this.timestamp = 0;
			return true;
		}
	},
	find : function(elem) {
		var i1 = elem.selectedIndex > 0 ? elem.selectedIndex : 0;
		var textGreater = i1 > 0 ? 
			(elem.options[i1].text.toUpperCase() < this.text.toUpperCase()) : false;
		var i0 = i1 > 0 && textGreater ? i1 : 0;
		var i2 = i1 > 0 && !textGreater ? i1 : elem.options.length-1;
		while (i0 <= i2) {
			i1 = Math.floor(i0 + (i2-i0)/2);
			textGreater = (elem.options[i1].text.toUpperCase() < this.text.toUpperCase());
			if (textGreater) i0 = i1 + 1;
			else i2 = i1 - 1;
		}
		elem.selectedIndex = (textGreater && i1+1<elem.options.length) ? i1+1 : i1;
	}
};


akme.copy(akme.xhr, {
	getXmlHttpResponse : function (url, returnBody, headerMap, paramMap) {
	  var xhr = new XMLHttpRequest();
	  var ary = [0, ""];
	  try {
	   if (paramMap) xhr.open("GET", url+"?"+this.encodeMap(paramMap), false);
	   else xhr.open("GET", url, false);
	   if (headerMap) for (var key in headerMap) {
	    xhr.setRequestHeader(key, headerMap[key]);
	   }
	   xhr.send("");
	   ary[0] = xhr.status;
	   if (!returnBody || (xhr.status && xhr.status != this.HTTP_OK)) {
	    ary[1] = xhr.statusText;
	   } else {
	    ary[1] = xhr.responseText;
	   }
	  }
	  catch (ex) {
	   ary = [ex.number, ex.description];
	   throw ex;
	  }
	  finally {
	   xhr = null;
	  }
	  return ary;
	 },
	 
	 postXmlHttp : function (url, returnBody, headerMap, postBody) {
	  var xhr = new XMLHttpRequest();
	  var ary = [0, ""];
	  try {
	   xhr.open("POST", url, false);
	   var hasContentType = false;
	   if (headerMap) for (var key in headerMap) {
	    xhr.setRequestHeader(key, headerMap[key]);
		if (key.toLowerCase() == "content-type") hasContentType = true;
	   }
	   if (!hasContentType) xhr.setRequestHeader(this.CONTENT_TYPE, this.CONTENT_XML[this.CONTENT_TYPE]);
	   xhr.send(postBody);
	   ary[0] = xhr.status;
	   if (!returnBody || (xhr.status && xhr.status != this.HTTP_OK)) {
	    ary[1] = xhr.statusText;
	   } else {
	    ary[1] = xhr.responseText;
	   }
	  }
	  catch (ex) {
	   ary = [ex.number, ex.description];
	  }
	  finally {
	   xhr = null;
	  }
	  return ary;
	 }
});


if (!akme._callbasep) akme._callbasep = {
	_tag : "",
	_lock : [true], // pop()===true to lock, push(true) to free.
	_count : 0,
	timeout : 9000,
    cleanup : function(id, doc, title) {
		if (!doc) doc = document;
		var elem = doc.getElementById(id);
		return (elem && (!title || elem.title == title)) ? elem.parentNode.removeChild(elem) : null;
	},
	call : function (urlStr, callbackStr, timeoutFcn, doc) {
		if (!doc) doc = document;
		var lock = this._lock.pop()===true;
		if (!lock || !callbackStr || doc.getElementById(callbackStr)) {
			if (lock) this._lock.push(true);
			return false;
		}
		var title = callbackStr+"_"+(++this._count);
		var call = doc.createElement(this._tag);
		call.id = callbackStr;
		call.className = this._tag+"p";
		call.title = title;
		call.src = urlStr;
		// onload should exist on all browsers: http://www.w3schools.com/jsref/dom_obj_frame.asp
		if ("iframe"==this._tag) call.onload = function(){ 
			setTimeout(callbackStr+"(document.getElementById(\""+ callbackStr +"\").contentDocument)", 0);
			};
		doc.body.appendChild(call);
		if (lock) this._lock.push(true);
		var callbasep = this;
		setTimeout(function() {
			// call will exist on timeout if the handler did not run and cleanup.
			var call = callbasep.cleanup(callbackStr, doc, title);
			if (call && timeoutFcn) timeoutFcn(call);
		}, this.timeout);
		return true;
	}
};

// iframe data access is governed by same document.domain and protocol, script is not.
// Both suffer from slow-failure by timeout, rather than XMLHttpRequest that fast-fails.
if (!akme.iframep) akme.iframep = akme.copy(akme.clone(akme._callbasep), {_tag:"iframe"});
if (!akme.scriptp) akme.scriptp = akme.copy(akme.clone(akme._callbasep), {_tag:"script"});


if (!akme.hsv2rgb) akme.hsv2rgb = function (hsv) {
    var red, grn, blu, i, f, p, q, t;
    var hue = hsv[0]%360;
    if (hsv[2]==0) return [0, 0, 0];
    var sat = hsv[1]/100;
    var val = hsv[2]/100;
    var hue = hue/60;
    i = Math.floor(hue);
    f = hue-i;
    p = val*(1-sat);
    q = val*(1-(sat*f));
    t = val*(1-(sat*(1-f)));
    switch (i) {
    case 0: red=val; grn=t; blu=p; break;
    case 1: red=q; grn=val; blu=p; break;
    case 2: red=p; grn=val; blu=t; break;
    case 3: red=p; grn=q; blu=val; break;
    case 4: red=t; grn=p; blu=val; break;
    case 5: red=val; grn=p; blu=q; break;
    }
    return [Math.floor(red*255), Math.floor(grn*255), Math.floor(blu*255)];
};

if (!akme.rgb2hsv) akme.rgb2hsv = function (rgb) {
    var x, val, f, i, hue, sat, val;
    var red = rgb[0]/255;
    var grn = rgb[1]/255;
    var blu = rgb[2]/255;
    x = Math.min(Math.min(red, grn), blu);
    val = Math.max(Math.max(red, grn), blu);
    if (x==val) return [undefined, 0, val*100];
    f = (red == x) ? grn-blu : ((grn == x) ? blu-red : red-grn);
    i = (red == x) ? 3 : ((grn == x) ? 5 : 1);
    hue = Math.floor((i-f/(val-x))*60)%360;
    sat = Math.floor(((val-x)/val)*100);
    val = Math.floor(val*100);
    return [hue, sat, val];
};

if (!akme.rgb2hex) akme.rgb2hex = function (rgb) {
	return this.toHexByte(rgb[0])+this.toHexByte(rgb[1])+this.toHexByte(rgb[2]);
};

if (!akme.toHexByte) akme.toHexByte = function (n) {
	if (n==null) return "00";
	n=parseInt(n); if (n==0 || isNaN(n)) return "00";
	n=Math.max(0,n); n=Math.min(n,255); n=Math.round(n);
	return "0123456789ABCDEF".charAt((n-n%16)/16)
    	+ "0123456789ABCDEF".charAt(n%16);
};
