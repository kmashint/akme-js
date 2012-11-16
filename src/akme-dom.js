// akme-dom.js

this.DOMParser = this.DOMParser || function() {
	this.xmldoc = null;
	// IE8 and earlier do not support DOMParser directly.
	// http://www.w3schools.com/Xml/xml_parser.asp
	// http://www.w3schools.com/dom/dom_errors_crossbrowser.asp
	// http://help.dottoro.com/ljcilrao.php
	try { if (!this.xmldoc) this.xmldoc = new ActiveXObject("Msxml2.DOMDocument"); } catch (ex) {}
    if (!this.xmldoc) throw new Error("This browser does not support DOMParser or Msxml2.DOMDocument.");
	this.xmldoc.async = false;
	this.parseFromString = function(text, contentType) {
		this.xmldoc.loadXML(text);
		if (this.xmldoc.parseError.errorCode != 0) {
			var err = this.xmldoc.parseError;
			throw new Error("DOMParser error "+ err.errorCode +" at line "+ err.line +" pos "+ err.linepos
				+": "+ err.reason);
		}
		// Real DOMParser: if (xmldoc.documentElement.nodeName=="parsererror") ... xmldoc.documentElement.childNodes[0].nodeValue
		return this.xmldoc;
	};
    return this;
};

if( !window.XMLSerializer ){
	// Helper for MSIE, MSIE9.
	// http://www.erichynds.com/jquery/working-with-xml-jquery-and-javascript/
	// http://www.vistax64.com/vista-news/284014-domparser-xmlserializer-ie9-beta.html
	window.XMLSerializer = function(){};
}
if( !window.XMLSerializer.prototype.serializeToString ){
	window.XMLSerializer.prototype.serializeToString = function(xmlobj) {return xmlobj.xml;};
}

if (!this.XMLHttpRequest) this.XMLHttpRequest = function() {
	try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
	catch (er) { throw new Error("This browser does not support XMLHttpRequest."); }
};
// Use new ActiveXObject("Msxml2.ServerXMLHTTP.6.0") to avoid Access is Denied in HTA.


akme.copyAll(this.akme, {
	_html5 : null,
	// IE8 documentMode or below
	isIE8 : "documentMode" in document && document.documentMode < 9,
	// W3C support
	isW3C : "addEventListener" in window,
	
	onEvent : function (elem, evnt, fnOrHandleEvent) {
		if ("click" === evnt && window.Touch && this.onEventTouch) this.onEventTouch(elem, fnOrHandleEvent);
		else if (this.isW3C) elem.addEventListener(evnt, fnOrHandleEvent, false);
		else elem.attachEvent("on"+evnt, typeof fnOrHandleEvent.handleEvent === "function" ? this.fixHandleEvent(fnOrHandleEvent).handleEvent : fnOrHandleEvent);
	},
	onContent : function (fnOrHandleEvent) {
		var elem = document;
		var evnt = "DOMContentLoaded";
		if (this.isW3C) elem.addEventListener(evnt, fnOrHandleEvent, false);
		else {
			// http://unixpapa.com/js/dyna.html
			if (notComplete()) elem.attachEvent("onreadystatechange", notComplete);
			function notComplete(ev) {
				//if (console) console.log(elem, " readyState ", elem.readyState, " ev ", ev, " type ", ev.type);
				if ("loaded"!=elem.readyState && "complete"!=elem.readyState) return true;
				else {
					if (typeof fnOrHandleEvent === "function") fnOrHandleEvent.call(elem, {type:evnt});
					else fnOrHandleEvent.handleEvent.call(fnOrHandleEvent, {type:evnt});
				}
			};
		}
	},
	onLoad : function (fnOrHandleEvent) { this.onEvent(window, "load", fnOrHandleEvent); },
	onUnload : function (fnOrHandleEvent) { this.onEvent(window, "unload", fnOrHandleEvent); },
	unEvent : function (elem, evnt, fnOrHandleEvent) {
		if ("click" === evnt && window.Touch && this.unEventTouch) this.unEventTouch(elem, fnOrHandleEvent);
		else if (this.isW3C) elem.removeEventListener(evnt, fnOrHandleEvent, false);
		else elem.detachEvent("on"+evnt, typeof fnOrHandleEvent.handleEvent === "function" ? fnOrHandleEvent.handleEvent : fnOrHandleEvent);
	},
	/** 
	 * Fix for IE8 that does not directly support { handleEvent : function (ev) { ... } }.
	 * Ensures internally to be applied only once by setting _ie8fix = true on the object.
	 */
	fixHandleEvent : function (self) {
		if (document.documentMode && document.documentMode < 9 && typeof self.handleEvent === "function" && !self.handleEvent._ie8fix) {
			var handleEvent = self.handleEvent;
			self.handleEvent = function(ev) { handleEvent.call(self, ev); };
			self.handleEvent._ie8fix = true;
		}
		return self;
	},
	/**
	 * Return the element of the Event.target, using the target.parentNode if the target is not an element.
	 */ 
	getEventElement : function (ev) {
		return (ev.target.nodeType === 1) ? ev.target : ev.target.parentNode;
	},
	/**
	 * Cross-browser cancel of regular DOM events.
	 */
	cancelEvent: function (ev) {
		if (evt.preventDefault) { ev.preventDefault(); ev.stopPropagation(); }
		else { ev.returnValue = false; ev.cancelBubble = true; }
	},
	
	getBaseHref : function () {
		var a = document.getElementsByTagName("base");
		return a.length != 0 ? a[0]["href"] : "";
	},
	getContextPath : function () {
		// Java ROOT contextPath is "", not "/", so use "/." to ensure a ROOT reference.
		var a = document.getElementsByName("head")[0].getElementsByTagName("meta");
		for (var i=0; i<a.length; i++) if (a[i].name === "contextPath") return a[i].content ? a[i].content : "/.";
		return "/.";
	},
	
	isHtml5 : function () {
		if (this._html5 == null) {
			var video = document.createElement('video');
			this._html5 = typeof video.canPlayType === "function";
			// video.canPlayType && video.canPlayType("video/mp4") != "";
			// ('video/mp4') or ('video/mp4; codecs=avc1.42E01E,mp4a.40.2')
		}
		return this._html5;
	},
	
	parseJSON : function (text, reviver) {
		return JSON.parse(text, reviver);
	},
	
	formatJSON : function (obj, replacer) {
		return JSON.stringify(obj, replacer);
	},
		
	parseXML : function (text, contentType) {
		return new DOMParser().parseFromString(text, contentType || "application/xml");
	},
	
	formatXML : function (xmldom) {
		return new XMLSerializer().serializeToString(xmldom);
	},
	
	/**
	 * Helper for application/xhtml+xml in IE8 since getElementById is missing.
	 */
	getElementByTagNameId : function (parentNode, tagName, id) {
		var tags = parentNode.getElementsByTagName(tagName);
		for (var i=0; i<tags.length; i++) if (id==tags[i].id) return tags[i];
		return null;
	},
	/**
	 * Find elements under the parentName by tagName.
	 * Returns a Javascript Array rather than a W3C DOM HTMLCollection.
	 */
	getElementsByTagName : function (parentNode, tagName) {
		return this.concat([], parentNode.getElementsByTagName(tagName));
	},

	/**
	 * Find elements under the parentName by tagName and className.
	 * A step beyond W3C parentNode.getElementsByTagName(tagName).
	 * 
	 * @param parentNode From which children are found by tagName.
	 * @param tagName Of children to find.
	 * @param className As simple or multiple space-delimited classNames that must be matched. 
	 */
	getElementsByTagNameClassName : function (parentNode, tagName, className) {
		var result = [];
		if (!parentNode || !className) return result;
		var classAry = className.split(" ");
		var tags = parentNode.getElementsByTagName(tagName);
		for (var i=0; i<tags.length; i++) {
			var tagClassName = tags[i].className;
			if (!tagClassName) continue;
			for (var j=0; j<classAry.length; j++) {
				var className = classAry[j];
				var pos = tagClassName.indexOf(className);
				if (pos == -1) continue;
				if ((pos == 0 || " " == tagClassName.charAt(pos-1)) 
						&& (pos+className.length == tagClassName.length || " " == tagClassName.charAt(pos+className.length))) {
					result.push(tags[i]);
				}				
			}
		}
		return result;
	},
	
	/**
	 * Helper to fix memory leak in IE8.
	 */
	replaceChild : function (parentNode, newChild, oldChild) {
		var dead = parentNode.replaceChild(newChild, oldChild);
		if (dead && !this.isW3C) {
			// elem.replaceChild leaks even in poor IE8.
			// Remove any iframe onload handlers otherwise they fire again with appendChild.
			var elems = dead.getElementsByTagName("iframe");
			for (var j=0; j<elems.length; j++) elems[j].onload = "";
			var recycler = document.getElementById("recycleBin");
			if (recycler) {
				recycler.appendChild(dead);
				recycler.innerHTML = "";
			}
		}
		return dead;
	},
	
	replaceTextDataAsArrayOrNull : function (text, dataMap) {
		var a = null;
		if (!text || !text.length) return a;
		var pos1 = 0;
		var pos2 = text.indexOf('{');
		if (pos2 != -1) a = [];
		else return a;
		for (; pos2 != -1; pos2 = text.indexOf('{', pos1)) {
			a.push(text.substring(pos1, pos2));
			pos1 = pos2+1;
			pos2 = text.indexOf('}', pos1);
			if (pos2 != -1) {
				var name = text.substring(pos1, pos2);
				if (dataMap[name]) a.push(dataMap[name]);
				else a.push(text.substring(pos1-1, pos2+1));
				pos1 = pos2+1;
			} else {
				pos1 = text.length;
			}
		}
		if (a.length) a.push(text.substring(pos1, text.length));
		return a;
	},
	
	/**
	 * Replace attribute values and inner html/text with keys from dataMap, starting from parentNode.
	 * e.g. <a data--href='{href}'>{title}</a> given {href:"http://goo.gl",title:"Google Url Shortener"}
	 * will replace the {href} and {title} and replace the data--href with href.  
	 * All such data--* are replaced, stripping the leading "data--".
	 * The use of data--href is to avoid the brower trying to load '{href}' as a file before being replaced.  
	 */
	replaceNodeData : function (parentNode, dataMap) {
		var parentAry = [parentNode];
		for (var parent = parentAry.pop(); parent != null; parent = parentAry.pop()) {
			var attrs = parent.attributes;
			if (attrs) for (var i=0; i<attrs.length; i++) {
				var attr = attrs[i];
				var name = attr.nodeName;
				var value = attr.nodeValue;
				if (name.lastIndexOf("data--",6) == 0) {
					name = name.substring(6);
					parent.removeAttribute(attr.nodeName);
					var a = this.replaceTextDataAsArrayOrNull(value, dataMap);
					if (a != null) parent.setAttribute(name, a.join(""));
				} else {
					var a = this.replaceTextDataAsArrayOrNull(value, dataMap);
					if (a != null) attr.nodeValue = a.join("");
				}
			}
			var childNodes = parent.childNodes;
			for (var i=0; i<childNodes.length; i++) {
				var child = childNodes[i];
				switch (child.nodeType) {
				case 1: // 1=ElementNode
					parentAry[parentAry.length]=(child);
					// fall through to TextNode as well
				case 3: case 4: // 3=TextNode, 4=CdataSectionNode
					var a = this.replaceTextDataAsArrayOrNull(child.nodeValue, dataMap);
					if (a != null) child.nodeValue = a.join("");
					break;
				}
			}
		}	
	},
	
	cloneNodeByCreateElement : function(doc, node, /*boolean*/ deep) {
		var clone = doc.createElement(node.nodeName);
		for (var i=0; i<node.attributes.length; i++) {
			var name = node.attributes[i].name;
			switch (name) {
			case "class": name = "className"; break;
			default: break;
			}
			clone[name] = node.attributes[i].value;
		}
		if (deep && node.innerHTML) clone.innerHTML = node.innerHTML;
		return clone;
	},
	/**
	 * Deep clone a node that is a template.  Sets the style display to empty and the id as specified, or empty if not provided
	 */
	cloneTemplateNode : function(node, id) {
		var clone = node.cloneNode(true);
		clone.id = id ? id : '';
		clone.style.display = '';
		return clone;
	},	
	importNode : function(doc, thatChild) {
		var result;
		var recbin = document.getElementById("recycleBin");
		var nodeName = thatChild.nodeName.toLowerCase();
		if ("importNode" in doc && !("documentMode" in doc && doc.documentMode == 9)) { 
			// Need to set innerHTML event after appendChild to convert simple XML to more useful (X)HTML.
			// Safari does not like /* CDATA */ in a script.cloneNode(true).
			// Chrome/Safari/WebKit does not like to importNode for a style.
			// .innerHTML seems to work for script and style but does not actually run script.
			// Setting script.text actually runs script across all browsers.
			// Also note W3C other.textContent, IE innerText, e.g. elem.textContext = other.textContent || other.innerText; 
			// http://www.phpied.com/dynamic-script-and-style-elements-in-ie/
			result = doc.createElement(nodeName==="link" || nodeName==="style" || nodeName==="script" ? "head" : "div");
			if (nodeName==="script" || nodeName==="style") {
				result.appendChild(this.cloneNodeByCreateElement(doc, thatChild, true));
			} else {
				result.appendChild(doc.importNode(thatChild, true));
			}
			var firstChild = result.firstChild;
			result.removeChild(firstChild);
			if (recbin) recbin.appendChild(result);
			return firstChild;
		} else {
			if (nodeName==="link" || nodeName==="style" || nodeName==="script") {
				// Handle special exceptions with IE elem.xml property.
				result = this.cloneNodeByCreateElement(doc, thatChild);
				var xml = thatChild.xml;
				var pos = xml.indexOf('>');
				if (pos+1 < xml.length) {
					var text = xml.substring(pos+1, xml.lastIndexOf('<'));
					if (text > "") {
						if (nodeName==="style") result.styleSheet.cssText = text;
						else if (nodeName==="script") result.text = text; //.replace(/<!\[CDATA\[|\]\]>/g, "");
					}
				}
				return result;
			} else {
				// Use innerHTML and the IE elem.xml property.
				result = doc.createElement("div");
				result.innerHTML = thatChild.xml;
				var firstChild = result.firstChild;
				result.removeChild(firstChild);
				if (recbin) recbin.appendChild(result);
				return firstChild;
			}
		}
	},
	
	/**
	 * Import and replace Elements into the given doc from thatParent.
	 * Return an array of elements that were replaced.
	 * The callbackFn is called when everything has loaded due to the possible async delay of script and iframe.
	 */
	importElementsReplaceById : function(doc, thatParent, callbackFn) {
		var a = [];
		var scriptTracker = {
			count : 0,
			callbackFn : null,
			check : function() { 
				if (console.logEnabled) console.log("scriptTracker.check count " +this.count);
				if (this.count < 1 && this.callbackFn) {
					try { this.callbackFn(); } 
					catch (er) { var t = "scriptTracker.callbackFn: "+ String(er); console.error(t); alert(t); }
					this.callbackFn = null;
				}
			},
			load : function(elem) {
				this.count++;
				elem.onload = function(ev) { scriptTracker.onload(ev); };
				elem.onreadystatechange = function(ev) {
					if (!this.readyState || this.readyState == "loaded" || this.readyState == "complete") scriptTracker.onload(ev);
				};
				if (console.logEnabled) console.log("scriptTracker.load count " +this.count);
			},
			onload : function(ev) {
				if (ev) {
					var elem = akme.getEventElement(ev);
					elem.onload = null;
					elem.onreadystatechange = null;
				}
				this.count--;
				this.check();
			}
		};
		var parentAry = [thatParent];
		for (var parent = parentAry.pop(); parent != null; parent = parentAry.pop()) {
			var childNodes = parent.childNodes;
			for (var i=0; i<childNodes.length; i++) {
				var child = childNodes[i];
				if (child.nodeType == 1) { // 1=ElementNode
					var thisChild = child.getAttribute("id") > "" ? doc.getElementById(child.getAttribute("id")) : null;
					if (thisChild) {
						var importChild = this.importNode(doc, child);
						var nodeName = importChild.nodeName.toLowerCase();
						var scriptChild = nodeName==="script" ? importChild : null;
						// FF/MSIE/Safari/WebKit seem to want script.text assigned to actually run the script.
						var scripts = scriptChild ? [scriptChild] : importChild.getElementsByTagName("script");
						if (scripts && scripts.length > 0) for (var j=0; j<scripts.length; j++) {
							var elem = scripts[j];
							var clone = this.cloneNodeByCreateElement(doc, elem, false);
							scriptTracker.load(clone);
							if (elem.text > "") clone.text = elem.text;
							if (!scriptChild) {
								var dead = akme.replaceChild(elem.parentNode, clone, elem);
							}
							else importChild = clone;
						}
						var dead = akme.replaceChild(thisChild.parentNode, importChild, thisChild);
						a[a.length] = importChild;
					} else {
						parentAry[parentAry.length]=(child);
					}
				}
			}
		}
		if (callbackFn) scriptTracker.callbackFn = callbackFn;
		scriptTracker.check();
		return a;
	},

	/**
	 * Import and append a child node to the given parent.
	 * Return the imported child node.
	 */
	importNodeAppendChild : function(thisParent, thatChild) {
		var doc;
		if (thisParent.ownerDocument) {
			doc = thisParent.ownerDocument;
		} else {
			doc = thisParent;
			thisParent = doc.getElementsByTagName("body")[0];
		}
		var result = this.importNode(doc, thatChild);
		thisParent.appendChild(result);
		return result;
	},
	
	toggleDisplay : function (elem) {
		elem.style.display = elem.style.display != "none" ? "none" : "";
	},
	
});


if (!akme.xhr) akme.xhr = {
	DATE_1970 : "Thu, 01 Jan 1970 00:00:00 GMT",
	HTTP_OK : 200,
	HTTP_NO_CONTENT : 204,
	HTTP_NOT_MODIFIED : 304,
	CONTENT_TYPE : "Content-Type",
	CONTENT_BINARY : {"Content-Type": "application/octet-stream"},
	CONTENT_TEXT : {"Content-Type": "text/plain"},
	CONTENT_URLENCODED : {"Content-Type": "application/x-www-form-urlencoded"},
	CONTENT_HTML : {"Content-Type": "text/html"},
	CONTENT_XHTML : {"Content-Type": "application/xhtml+xml"},
	CONTENT_XML : {"Content-Type": "text/xml"},
	CONTENT_JSON : {"Content-Type": "application/json"},
	NO_CACHE_HEADER_MAP : { "Pragma": "no-cache", "Cache-Control": "no-cache, no-store, max-age=0, must-revalidate" },
	PRIVATE_CACHE_HEADER_MAP : { "Pragma": "private", "Cache-Control": "private" },
	PRIVATE_VALID_CACHE_HEADER_MAP : { "Pragma": "private", "Cache-Control": "private, must-revalidate" },
	PUBLIC_CACHE_HEADER_MAP : { "Pragma": "public", "Cache-Control": "public" },
	PUBLIC_VALID_CACHE_HEADER_MAP : { "Pragma": "public", "Cache-Control": "public, must-revalidate" },
	FUTURE_CACHE_HEADER_MAP : { "Pragma": "public", "Cache-Control": "public, max-age=900" },
	
	encodeMap : function(map) {
	  var r = [];
	  if (!map) return "";
	  for (var key in map) {
		  var val = map[key];
		  if (val && val.constructor === Array) {
			  for (var j=0; j<val.length; j++) r.push(encodeURIComponent(key)+'='+encodeURIComponent(val[j]));
		  }
		  else r.push(encodeURIComponent(key)+'='+encodeURIComponent(val));
	  }
	  return r.join("&");
	},
	 
	open : function(method, url, async) {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, async!=false);
		xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
		return xhr;
	},
	 
	getXML: function ( url ) { //simply grab of an xml file and return the xml document
		var xhr = this.open('GET', url, false);
		xhr.send(null);
		return this.getResponseXML( xhr );
	},
	 
	getJSON: function ( url ) { //simply grab of an xml file and return the xml document
		var xhr = this.open('GET', url, false);
		xhr.send(null);
		return this.getResponseJSON( xhr );
	},
	 
	getResponseContentType : function(/*XMLHttpRequest*/ xhr) {
		// Handle IE XDomainRequest in addition to W3C standard.
		return xhr.contentType || xhr.getResponseHeader("Content-Type");
	},
		 
	getResponseXML : function(/*XMLHttpRequest*/ xhr) {
		var isXMLDOM = !!(xhr.responseXML && xhr.responseXML.documentElement);
		// Handle IE XDomainRequest contentType in addition to W3C standard.
		var contentType = this.getResponseContentType(xhr);
		var xml;
		if (xhr.responseXML && !isXMLDOM && "ActiveXObject" in window &&
				("application/xhtml+xml" == contentType)) {
			// Handle broken application/xhtml+xml in IE8 and earlier.
			xml = new DOMParser().parseFromString(xhr.responseText, contentType);
		} else {
			xml = xhr.responseXML;
		}
		if (xml.documentElement.nodeName === 'parsererror') {
			xml = null;
		}
		return xml;
	},
	
	getResponseJSON : function(/*XMLHttpRequest*/ xhr, reviver) {
		return JSON.parse(xhr.responseText, reviver);
	},
	
	/** 
	 * Ensure standard My-Name formatting of HTTP header names.
	 */
	formatHttpHeaderName : function(name) {
		var a = name.split("-");
		for (var i=0; i<a.length; i++) {
			a[i] = a[i].charAt(0).toUpperCase() + a[i].substring(1);
		}
		return a.join("-");
	},
	
	/** 
	 * Ensure standard My-Name formatting of HTTP header names for particular ones in the given nameAry.
	 */
	fixHttpHeaderNames : function(headerMap, nameAry) {
		for (var i=0; i<nameAry.length; i++) { nameAry[i] = nameAry[i].toLowerCase(); }
		for (var key in headerMap) {
			if (Array.indexOf(nameAry, key.toLowerCase()) == -1) continue;
			var name = this.formatHttpHeaderName(key);
			if (name != key) {
				headers[name] = headers[key];
				delete headers[key];
			}
		}
	},
	
	/** 
	 * Parse header text returned by XMLHttpRequest.getAllResponseHeaders().
	 */
	parseHeaders : function(text) { // also see akme.core.MessageBroker
		var headers = {};
		for (var pos1=0, pos2=text.indexOf("\n"); pos2 != -1; pos1=pos2+1, pos2=text.indexOf("\n", pos1)) {
			var pos3 = text.indexOf(": ", pos1);
			if (pos3 != -1) headers[this.formatHttpHeaderName(text.substring(pos1,pos3))] = text.substring(pos3+2, pos2).split("\r")[0];
		}
		return headers;
	},
	
	/**
	 * Use a new XHR to call the given method and url with optional headers and optional content.
	 * Will use the callback when readyState==4 (DONE).
	 */
	callAsync : function(method, url, headers, content, /*function(headers,content)*/ callbackFnOrOb) {
		var xhr = this.open(method, url, true);
		callAsyncXHR(xhr, headers, content, callbackFnOrOb);
		return xhr;
	},
	
	/**
	 * Use the given XHR to call with the given method and url with optional headers and optional content.
	 * Will use the callback when readyState==4 (DONE).
	 */
	callAsyncXHR : function(/*XMLHttpRequest*/ xhr, method, url, headers, content, /*function(headers,content)*/ callbackFnOrOb) {
		xhr.open(method, url, true);
		xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
		for (var key in headers) {
			var name = this.formatHttpHeaderName(key);
			xhr.setRequestHeader(name, headers[key]);
			if (name != key) {
				headers[name] = headers[key];
				delete headers[key];
			}
		}
		for (var key in headers) xhr.setRequestHeader(key, headers[key]);
		if (!(typeof content === 'string' || content instanceof String)) {
			if (/xml;|xml$/.test(headers["Content-Type"])) {
				content = akme.formatXML(content);
			} else if (/json;|json$/.test(headers["Content-Type"])) {
				content = akme.formatJSON(content);
			}
		}
		var self = this; // closure
		xhr.onreadystatechange = function() {
			var xhr = this;
			if (!xhr.readyState !== 4) return;
			var headers = self.parseHeaders(xhr.getAllResponseHeaders());
			var content;
			if (/xml;|xml$/.test(headers["Content-Type"])) {
				content = self.getResponseXML(xhr);
			} else if (/json;|json$/.test(headers["Content-Type"])) {
				content = self.getResponseJSON(xhr);
			} else {
				content = xhr.responseText;
			}
			akme.handleEvent(callbackFnOrOb, headers, content);
			self = xhr = callbackFnOrOb = null; // closure cleanup
		};
		if (typeof content !== 'undefined') xhr.send(content);
		else xhr.send();
		return;
	}
	
};


/**
 * akme.cookieStorage
 */
akme.cookieStorage = akme.cookieStorage || { 
	name : "akme.cookieStorage",

	getItem : function (name) {
		var i,p,x,y,cookieAry = document.cookie.split(";");
		for (i=0; i<cookieAry.length; i++) {
		 p = cookieAry[i].indexOf("=");
		 x = cookieAry[i].substring(0,p);
		 y = cookieAry[i].substring(p+1);
		 x = x.replace(/^\s+|\s+$/g,"");
		 if (x==name) return unescape(y);
		}
	},
	
	setItem : function (name,value,exdays,path) {
		var exdate = new Date();
		exdate.setDate(exdate.getDate() + (exdays ? exdays : 0));
		document.cookie = name + "=" + escape(value) + (!exdays ? "" : "; expires="+exdate.toUTCString()) + (!path ? "" : "; path="+path);
	},
	
	removeItem : function (name,path) {
		document.cookie = name+"=; expires=0"+ (!path ? "" : "; path="+path);
	}
};


/**
 * This is singleton-style but should be new'd and set/copy {id:"...", allowOrigins:[...]}.
 * Use:
 *   window.messageBroker = new akme.core.MessageBroker({id:"window.messageBroker", allowOrigins:[...]});
 */
if (!akme.core.MessageBroker) akme.core.MessageBroker = akme.extend(akme.copyAll(function(cfg){
	this.id = cfg.id;
	this.allowOrigins = cfg.allowOrigins;
	this.callbackKey = 0;
	this.callbackMap = {};
	this.callbackTime = {};
}, {CLASS:"akme.core.MessageBroker"}), {
	destroy : function() {
		for (var key in this.callbackMap) delete this.callbackMap[key];
		for (var key in this.callbackTime) delete this.callbackTime[key];
	},
	newCallbackKey : function() {
		var key = this.callbackKey = (this.callbackKey+1)%0xffff;
		return key;
	},
	callAsync : function(frame, headers, content, callbackFnOrOb) {
		var key = this.newCallbackKey();
		headers["callback"] = this.id+".callbackMap."+key;
		var self = this; // closure
		self.callbackMap[key] = function(headers, content) {
			delete self.callbackMap[key];
			delete self.callbackTime[key];
			akme.handleEvent(callbackFnOrOb, headers, content);
			self = key = callbackFnOrOb = null; // closure cleanup
		};
		self.callbackTime[key] = new Date().getTime();
		akme.xhr.fixHttpHeaderNames(headers, ["Content-Type"]);
		if (/xml;|xml$/.test(headers["Content-Type"]) && !(content instanceof String) && content instanceof Object) {
			content = akme.formatXML(content);
		}
		else if (/json;|json$/.test(headers["Content-Type"]) && !(content instanceof String) && content instanceof Object) {
			content = akme.formatJSON(content);
		}
		var msg = this.formatMessage(headers, content);
		var targetOrigin = frame.src.substring(0, frame.src.indexOf("/", 8));
		frame.contentWindow.postMessage(msg, targetOrigin); // "*" is insecure
		return headers["callback"];
	},
	handleEvent : function(ev) { // ev.data, ev.origin, ev.source
		var deny = true;
		for (var i=0; i<this.allowOrigins.length; i++) {
			if (this.allowOrigins[i] === ev.origin) {deny = false; break;}
		}
		if (deny) { console.warn(this.id+" deny "+ ev.origin); return; }
		var data = this.parseMessage(ev.data);
		if (!data.headers.call || typeof this[data.headers.call] !== 'function') return;
		this[data.headers.call](data.headers, data.content, ev);
	},
	formatMessage : function(headers, content) {
		var a = [];
		a[a.length] = "call: "+ headers["call"];
		for (var key in headers) if ("call"!=key && typeof headers[key] != "undefined") a[a.length] = key +": "+ headers[key];
		return a.join("\r\n") + "\r\n\r\n" + (content ? content : "");
	},
	parseMessage : function(text) {
		var content = "";
		var headers = {};
		for (var pos1=0, pos2=text.indexOf("\n"); pos2 != -1; pos1=pos2+1, pos2=text.indexOf("\n", pos1)) {
			if (pos1+1 >= pos2) { content = text.substring(pos2+1); break; } // found the content
			var pos3 = text.indexOf(": ", pos1);
			headers[text.substring(pos1,pos3)] = text.substring(pos3+2, pos2).split("\r")[0];
		}
		return {headers:headers, content:content};
	},
	XMLHttpRequest : function(headers, content, messageEvent) {
		// postMessage to an async XMLHttpRequest (or setTimeout) is tricky between IE8 and IE9.
		// IE9 and W3C browsers are fine to use the messageEvent in a delayed async response,
		// but IE8 wants separate closure variables for source and origin.  
		var xhr = akme.xhr.open(headers.method, headers.url, true);
		var callback = headers.callback;
		var source = messageEvent.source;
		var origin = messageEvent.origin;
		delete headers["call"];
		delete headers["callback"];
		delete headers["method"];
		delete headers["url"];
		if (headers) for (var key in headers) xhr.setRequestHeader(key, headers[key]);
		var self = this;
		xhr.onreadystatechange = function() {
			var xhr = this;
			if (xhr.readyState !== 4) return;
			var headers = {
				call : "XMLHttpResponse",
				readyState : xhr.readyState, 
				status : xhr["status"] ? xhr.status : 0,
				statusText : xhr["statusText"] ? xhr.statusText : ""
			};
			if (callback) headers.callback = callback;
			var headerStr = xhr.getAllResponseHeaders();
			if (headerStr) akme.copyAll(headers, akme.xhr.parseHeaders(headerStr));
			var content = xhr["responseText"] ? xhr.responseText : "";
			if (/xml;|xml$/.test(headers["Content-Type"]) || /html;|html$/.test(headers["Content-Type"])) {
				// Remove DOCTYPE ... SYSTEM if found since the DTD reference will be invalid after postMessage.
				var pos1 = content.indexOf("<"+"!DOCTYPE ");
				var pos2 = pos1 !== -1 ? content.indexOf(">", pos1+10) : -1;
				if (pos2 !== -1 && (content.lastIndexOf(" SYSTEM ", pos2) !== -1 ||
						(document.documentMode && document.documentMode < 9 && content.lastIndexOf(" PUBLIC ", pos2) === -1))) {
					content = content.substring(0, pos1) + content.substring(content.indexOf("<", pos2+1));
				}
			}
			var result = self.formatMessage(headers, content);
			if (window.console) console.log(self.id+' '+location.protocol+'//'+location.host+' XMLHttpRequest postMessage back '+ String(messageEvent.origin || origin));
			if (messageEvent.source) messageEvent.source.postMessage(result, messageEvent.origin);
			else source.postMessage(result, origin);
			self = xhr = callback = messageEvent = source = origin = null; // closure cleanup
		};
		xhr.send(content || null);
	},
	XMLHttpResponse : function(headers, content) {
		var callbackFnOrOb = akme.getProperty(window, headers["callback"]);
		if (callbackFnOrOb && (headers.status == 200 || headers.status == 204 || headers.status == 304)) {
			if (/xml;|xml$/.test(headers["Content-Type"])) {
				var resx = akme.parseXML(content, "application/xml");
				if (callbackFnOrOb && typeof resx === 'object' && ("childNodes" in resx)) {
					if (resx.firstChild.nodeName.lastIndexOf(":Envelope") !== -1 &&
							resx.firstChild.lastChild.nodeName.lastIndexOf(":Body") !== -1) {
						// This is a SOAP message Envelope/Body.
						resx = resx.firstChild.lastChild.firstChild;
					}
				}
				akme.handleEvent(callbackFnOrOb, headers, resx);
			}
			else if (/json;|json$/.test(headers["Content-Type"])) {
				var reso = akme.parseJSON(content);
				akme.handleEvent(callbackFnOrOb, headers, reso);
			} // else if (/x-www-form-urlencoded;|x-www-form-urlencoded$/.test(headers["Content-Type"]))
			else {
				akme.handleEvent(callbackFnOrOb, headers, content);
			}
			return;
		}
		if (console.logEnabled) alert(akme.formatJSON(headers)+"\n\n"+content);
		if (callbackFnOrOb) akme.handleEvent(callbackFnOrOb, headers, content);
	},
	StorageRequest : function(headers, content, messageEvent) {
		var storage = akme.localStorage;
		var callback = headers.callback;
		var source = messageEvent.source;
		var origin = messageEvent.origin;
		
		if (content) {
			if ("importAll"===headers.method) storage[headers.method](akme.parseJSON(content));
			else content = storage[headers.method](headers.type, headers.key, content);
		} else {
			content = storage[headers.method](headers.type, headers.key);
		}
		if (typeof content === "object") {
			content = akme.formatJSON(content);
		}
		var headers = {
			call : "StorageResponse",
			method : headers.method,
			type : headers.type,
			key : headers.key
		};
		if (callback) headers.callback = callback;

		var result = this.formatMessage(headers, content);
		if (window.console) console.log(this.id+' '+location.protocol+'//'+location.host+' StorageRequest postMessage back '+ String(messageEvent.origin || origin));
		if (messageEvent.source) messageEvent.source.postMessage(result, messageEvent.origin);
		else source.postMessage(result, origin);
	},
	StorageResponse : function(headers, content) {
		var callbackFnOrOb = akme.getProperty(window, headers["callback"]);
		if (callbackFnOrOb) {
			akme.handleEvent(callbackFnOrOb, headers, akme.parseJSON(content));
			return;
		}
		if (console.logEnabled) alert(akme.formatJSON(headers)+"\n\n"+content);
	}
});
