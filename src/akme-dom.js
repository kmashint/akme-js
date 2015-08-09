// akme-dom.js
/*jshint browser: true, devel: true */
/*globals ActiveXObject, escape, unescape, akme */

(function(self){

	akme.copyAll(akme, {
		isIE8 : "documentMode" in document && document.documentMode === 8,
		isW3C : "addEventListener" in window
	});
    if (!(akme.isW3C || akme.isIE8) || !window.postMessage || !window.XMLHttpRequest) {
        console.error(
            "This browser is unsupported, it must be MSIE 8 or support HTML 5 with postMessage and XMLHttpRequest."
            );
    }
	
	// IE8 and earlier do not support DOMParser directly.
	// http://www.w3schools.com/Xml/xml_parser.asp
	// http://www.w3schools.com/dom/dom_errors_crossbrowser.asp
	// http://help.dottoro.com/ljcilrao.php
	// Mozilla or Chrome DOMParser: if (xmldoc.getElementsByTagName("parsererror").length) ...
	function DOMParser(){ 
		this.xmldoc = new ActiveXObject("Msxml2.DOMDocument"); 
		this.xmldoc.async = false; 
	}
	if (!self.DOMParser) self.DOMParser = DOMParser;
	var oldParse = self.DOMParser.prototype.parseFromString;
	self.DOMParser.prototype.parseFromString = function(text, contentType) {
		if (this.xmldoc) { // MSIE 8
			this.xmldoc.loadXML(text);
			if (this.xmldoc.parseError.errorCode !== 0) {
				var err = this.xmldoc.parseError;
				throw new SyntaxError("DOMParser error "+ err.errorCode +" at line "+ err.line +" pos "+ err.linepos +
					": "+ err.reason);
			}
			return this.xmldoc;
		} else {
			try { this.xmldoc = oldParse.call(this, text, contentType); }
			catch (er) { if (!(er instanceof SyntaxError)) throw new SyntaxError(er); }
			if (!this.xmldoc || !this.xmldoc.documentElement) { 
				throw new SyntaxError("Invalid XML: "+ text);
			}
			else if (this.xmldoc.getElementsByTagName("parsererror").length) {
				throw new SyntaxError(this.xmldoc.documentElement.innerHTML);
			}
			return this.xmldoc;
		}
	};

	// Helper for MSIE, MSIE9.
	// http://www.erichynds.com/jquery/working-with-xml-jquery-and-javascript/
	// http://www.vistax64.com/vista-news/284014-domparser-xmlserializer-ie9-beta.html
	// https://github.com/clientside/amplesdk/issues/127
	if (!self.XMLSerializer) self.XMLSerializer = function(){};
	if (!self.XMLSerializer.prototype.serializeToString || (document.documentMode && document.documentMode == 9)) 
		self.XMLSerializer.prototype.serializeToString = function(xmlobj) { return xmlobj.xml; };

	// Use new ActiveXObject("Msxml2.ServerXMLHTTP.6.0") to avoid Access is Denied in HTA.
	// For Microsoft Scripting in general: try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
	// catch (er) { throw new ReferenceError("This browser does not support XMLHttpRequest."); }
	if (!self.XMLHttpRequest) self.XMLHttpRequest = function() { 
		try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
		catch (er) { throw new Error("This browser does not support XMLHttpRequest."); }
	};
})(this);


akme.copyAll(this.akme, {
	_html5 : null,
	onContent : function (evCallback) {
		var self = this, elem = document, type = "DOMContentLoaded";
		// Includes special handling to emulate DOMContentLoaded in MSIE 8.
		if (self.onContent.ready) {
            contentReady();
        } else if (!contentLoaded()) {
			if (self.isW3C) {
				elem.addEventListener(type, contentLoaded, false);
				window.addEventListener("load", contentLoaded, false);
			} else {
				elem.attachEvent("onreadystatechange", contentLoaded);
				window.attachEvent("onload", contentLoaded);
			}
		}
		function contentLoaded(ev) {
			// See https://developer.mozilla.org/en-US/docs/Web/API/Document/readyState
			// Some documents may only get to readyState interactive, not complete, e.g. iframes.
			// Note checks for premature IE interactive state further below.
			//console.log("contentLoaded", location.href, " readyState ", elem && elem.readyState, " ev ", ev);
			if ((!ev || ev.type !== "load") && !/interactive|complete/.test(elem.readyState)) {
				return false;
			}
			if (self.isW3C) {
				elem.removeEventListener(type, contentLoaded, false);
				window.removeEventListener("load", contentLoaded);
				contentReady();
			} else {
				elem.detachEvent("onreadystatechange", contentLoaded);
				window.detachEvent("onload", contentLoaded);
				// DOMContentLoaded approximation that uses a doScroll,
				// as found by Diego Perini: http://javascript.nwbox.com/IEContentLoaded/.
				// Modified by other RequireJS contributors, including jdalton.
				// See https://github.com/requirejs/domReady/blob/master/domReady.js
				var isTop = false, testDiv = document.createElement('div'), intervalId;
				try {
					isTop = window.frameElement === null;
				} catch (er) {}
				if (testDiv.doScroll && isTop && window.external) {
					intervalId = setInterval(function () {
						try {
							testDiv.doScroll();
							clearInterval(intervalId);
							contentReady();
						} catch (er) {}
					}, 50);
				} else {
					contentReady();
				}
			}
		}
		function contentReady() {
			// Handle immediately after the next IO cycle, once the DOM content is ready.
            if (!self.onContent.ready) self.onContent.ready = true;
			setTimeout(function(){
				self.handleEvent(evCallback, {type:type, target:elem});
			});
		}
	},
 	onLoad : function (evCallback) { this.onEvent(window, "load", evCallback); },
	onUnload : function (evCallback) { this.onEvent(window, "unload", evCallback); },
	onEvent : function (elem, evnt, evCallback) {
		if ("click" === evnt && window.Touch && this.onEventTouch) this.onEventTouch(elem, evCallback);
		else if (this.isW3C) elem.addEventListener(evnt, evCallback, false);
		else elem.attachEvent("on"+evnt, typeof evCallback.handleEvent === "function" ? this.fixHandleEvent(evCallback).handleEvent : evCallback);
	},
	unEvent : function (elem, evnt, evCallback) {
		if ("click" === evnt && window.Touch && this.unEventTouch) this.unEventTouch(elem, evCallback);
		else if (this.isW3C) elem.removeEventListener(evnt, evCallback, false);
		else elem.detachEvent("on"+evnt, typeof evCallback.handleEvent === "function" ? evCallback.handleEvent : evCallback);
	},
	/** 
	 * Fix for IE8 that does not directly support { handleEvent : function (ev) { ... } }.
	 * Ensures internally to be applied only once by setting _ie8fix on the object.
	 */
	fixHandleEvent : function (self) {
		if (this.isIE8 && typeof self.handleEvent === "function" && !self.handleEvent._ie8fix) {
			var handleEvent = self.handleEvent;
			self.handleEvent = function() { handleEvent.apply(self, arguments); };
			self.handleEvent._ie8fix = function() { return handleEvent; };
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
	 * Return the element to which the listener was attached, taking an objectOrFunctionMatch to handle IE8.
	 * The objectOrFunctionMatcher can be a function or an object, where the following pairs are equivalent:
	 * 
	 *   EITHER function(elem) { return elem.id=="myId"; } 
	 *   OR { id:"myId" },
	 *   
	 *   EITHER function(elem) { return akme.hasClass(elem,"myClass"); }
	 *   OR { "class":"myClass" },
	 *   
	 *   EITHER function(elem) { return akme.hasClass(elem,"myClass") && elem.getAttribute("attribute")=="myAttribute"; }
	 *   OR { "class":"myClass", "attribute":"myAttribute" }
	 */
	getEventCurrentTarget : function (ev,objectOrFunctionMatcher) {
		if (ev.currentTarget) return ev.currentTarget;
		var t = this.getEventElement(ev);
		if (typeof objectOrFunctionMatcher == "function") while (t && t.nodeType == 1) {
			if (objectOrFunctionMatcher(t)) return t;
			t = t.parentNode;
		}
		else while (t && t.nodeType == 1) {
			var found = true;
			for (var k in objectOrFunctionMatcher) {
				if ("class"==k) {
					if (!this.hasClass(t, objectOrFunctionMatcher[k])) found = false;
				}
				else if (t.getAttribute(k) != objectOrFunctionMatcher[k]) found = false;
			}
			if (found) return t;
			t = t.parentNode;
		}
		return t;
	},
	/**
	 * Cancel DOM Event, fix-ie8.js will add preventDefault(), stopPropagation().
	 */
	cancelEvent: function ( ev ) {
		ev.preventDefault();
		ev.stopPropagation();
	},
	getBaseHref : function () {
		var a = document.getElementsByTagName("base");
		return a.length !== 0 ? a[0].href : "";
	},
	getContextPath : function () {
		// Java ROOT contextPath is "", not "/", so use "/." to ensure a ROOT reference.
		var a = document.getElementsByName("head")[0].getElementsByTagName("meta");
		for (var i=0; i<a.length; i++) if (a[i].name === "contextPath") return a[i].content ? a[i].content : "/.";
		return "/.";
	},
	
	isHtml5 : function () {
		if (this._html5 == null) {
			try {
				var video = document.createElement("video");
				this._html5 = (typeof video.canPlayType !== 'undefined' && video.canPlayType("video/mp4") != "");
				// video/mp4; codecs=avc1.42E01E,mp4a.40.2
			} catch ( vidErr ) {
				this._html5 = false;
			}
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
				className = classAry[j];
				var pos = tagClassName.indexOf(className);
				if (pos == -1) continue;
				if ((pos === 0 || " " == tagClassName.charAt(pos-1)) &&
						(pos+className.length == tagClassName.length || " " == tagClassName.charAt(pos+className.length))) {
					result.push(tags[i]);
				}				
			}
		}
		return result;
	},
	
	/**
	 * Helper to fix memory leaks in IE8.
	 */
	recycleChild : function (dead) {
		if (!dead || this.isW3C) return dead;
		var recycler = document.getElementById("recycleBin");
		if (!recycler) return dead;
		// elem.replaceChild leaks in poor IE8.
		// Remove any iframe onload handlers otherwise they fire again with appendChild.
		var elems = dead.getElementsByTagName("iframe");
		for (var j=0; j<elems.length; j++) elems[j].onload = "";
		recycler.appendChild(dead);
		recycler.innerHTML = "";
		return dead;
	},
	removeChild : function (oldChild) {
		return this.recycleChild(oldChild.parentNode.removeChild(oldChild));
	},
	replaceChild : function (parentNode, newChild, oldChild) {
		return this.recycleChild(parentNode.replaceChild(newChild, oldChild));
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
				var value = this.getProperty(dataMap, name);
				if (value != null) a.push(value);
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
		var a, parentAry = [parentNode];
		for (var parent = parentAry.pop(); parent != null; parent = parentAry.pop()) {
			var attrs = parent.attributes;
			if (attrs) for (var i=0; i<attrs.length; i++) {
				var attr = attrs[i], name = attr.nodeName, value = attr.nodeValue;
				if (name.lastIndexOf("data--",6) === 0) {
					name = name.substring(6);
					parent.removeAttribute(attr.nodeName);
					a = this.replaceTextDataAsArrayOrNull(value, dataMap);
					if (a != null) parent.setAttribute(name, a.join(""));
				} else {
					a = this.replaceTextDataAsArrayOrNull(value, dataMap);
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
					a = this.replaceTextDataAsArrayOrNull(child.nodeValue, dataMap);
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
		var result, firstChild,
            recbin = document.getElementById("recycleBin"),
            nodeName = thatChild.nodeName.toLowerCase();
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
			firstChild = result.firstChild;
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
				firstChild = result.firstChild;
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
		var scriptTracker = null;
		scriptTracker = {
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
								akme.replaceChild(elem.parentNode, clone, elem);
							}
							else importChild = clone;
						}
						akme.replaceChild(thisChild.parentNode, importChild, thisChild);
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
	
	getAttributes : function(elem, /*optional-to*/map) {
        var attrs = elem.attributes;
		map = map || {};
		for (var i=0; i<attrs.length; i++) map[attrs[i].name] = elem.getAttribute(attrs[i].name); // getAttribute for symmetry
		return map;
	},
	
	setAttributes : function(elem, /*required-from*/map) {
		for (var key in map) elem.setAttribute(key, map[key]);
		return elem;
	}
	
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
	NO_CACHE_HEADER_MAP : { "Pragma": "no-cache", "Cache-Control": "no-cache, no-store" },
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
	
	decodeUrlEncoded : function(data) {
		var map = {};
		if (typeof data === "undefined" || data === null) return map;
		var ary = String(data).split("&");
		for (var i=0; i<ary.length; i++) {
			var val = ary[i].split("=");
			map[decodeURIComponent(val[0])] = val.length > 1 ? decodeURIComponent(val[1]) : "";
		}
		return map;
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
		return xhr.contentType ? (xhr.contentType || "") : (xhr.getResponseHeader("Content-Type") || "");
	},
	getStatus : function(/*XMLHttpRequest*/ xhr) {
		// IE8 returns internal 1223 for HTTP 204 NO CONTENT and strips headers.  Can't recover headers.
		return (xhr.status && xhr.status == 1223) ? 204 : xhr.status;
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
				headerMap[name] = headerMap[key];
				delete headerMap[key];
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
		var xhr = new XMLHttpRequest();
		this.callAsyncXHR(xhr, method, url, headers, content, callbackFnOrOb);
		return xhr;
	},
	
	/**
	 * Use the given XHR to call with the given method and url with optional headers and optional content.
	 * Will use the callback when readyState==4 (DONE).
	 */
	callAsyncXHR : function(/*XMLHttpRequest*/ xhr, method, url, headers, content, /*function(headers,content)*/ callbackFnOrOb) {
		var self = this; // closure
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
		if (headers && !(typeof content === 'string' || content instanceof String)) {
			var type = headers["Content-Type"];
			if (/json;|json$/.test(type)) content = akme.formatJSON(content);
			else if (/xml;|xml$/.test(type)) content = akme.formatXML(content);
		}
		xhr.onreadystatechange = function() {
			var xhr = this;
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
	},
	
	callPromise : function(method, url, headers, content) {
		var xhr = new XMLHttpRequest();
		return this.callPromiseXHR(xhr, method, url, headers, content);
	},
	
	callPromiseXHR : function(/*XMLHttpRequest*/ xhr, method, url, headers, content) {
		var self = this, promise = new akme.core.Promise(executor);
		function executor(resolve, reject) {
			self.callAsyncXHR(xhr, method, url, headers, content, function(headers,content){
                if (content !== undefined) headers.content = content;
				if (headers.status >= 400) {
					reject(headers);
				} else {
					resolve(headers);
				}
			});
		}
		return promise;
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
if (!akme.core.MessageBroker) akme.core.MessageBroker = akme.extendClass(akme.copyAll(function(cfg){
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
	deleteCallbackKey : function(key) {
		delete this.callbackMap[key];
		delete this.callbackTime[key];
	},
	callAsync : function(headers, content, callbackFnOrOb) {
		// OR older function(frame, headers, content, callbackFnOrOb)
		var frame;
		if (headers instanceof Element) {
		 	frame = arguments[0];
		 	headers = arguments[1];
		 	content = arguments[2];
		 	callbackFnOrOb = arguments[3];
		} else {
			frame = document.getElementById(this.id);
		}
		var key = this.newCallbackKey();
		headers.callback = this.id+".callbackMap."+key;
		var self = this; // closure
		self.callbackMap[key] = function(headers, content) {
			self.deleteCallbackKey(key);
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
		return headers.callback;
	},
	submitAsync : function(elem, callbackFnOrOb) {
		var headers = {call:"SubmitRequest"};
		var key = this.newCallbackKey();
		headers.callback = this.id+".callbackMap."+key;
		var self = this; // closure
		self.callbackMap[key] = function(headers, content) {
			self.deleteCallbackKey(key);
			akme.handleEvent(callbackFnOrOb, headers, content);
			self = key = callbackFnOrOb = null; // closure cleanup
		};
		self.callbackTime[key] = new Date().getTime();
		self[headers.call](headers, {type:'submit', target:elem});
		return headers.callback;
	},
	handleEvent : function(ev) { // ev.data, ev.origin, ev.source
		var deny = true;
   		var hasDomain = location.hostname.indexOf(".") !== -1 || 
		location.hostname.indexOf(".local",location.hostname.length-6) == location.hostname.length-6;
		if (ev.origin == location.href.substring(0, location.href.indexOf('/', 8)) ||
	   			(!hasDomain && ev.origin.substring(ev.origin.indexOf('/')) ==
	   				location.href.substring(location.href.indexOf('/'), location.href.indexOf('/', 8))
	   			)) deny = false; // allow self both http and https
	    for (var i=0; i<this.allowOrigins.length; i++) if (this.allowOrigins[i]==ev.origin) deny = false;
		var data = this.parseMessage(ev.data);
		if (deny) { console.error(this.id+" at "+ location.href +" DENY "+ data.call +" from "+ ev.origin); return; }
		var callback = data.headers.callback;
		if (!data.headers.call || typeof this[data.headers.call] !== 'function' || 
				(callback && callback.substring(0, callback.lastIndexOf(".callbackMap.")) != this.id)) {
			return;
		}
		this[data.headers.call].call(this, data.headers, data.content, ev);
	},
	formatMessage : function(headers, content) {
		var a = [];
		a[a.length] = "call: "+ headers.call;
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
		delete headers.call;
		delete headers.callback;
		delete headers.method;
		delete headers.url;
		if (headers) for (var key in headers) xhr.setRequestHeader(key, headers[key]);
		var self = this;
		xhr.onreadystatechange = function() {
			var xhr = this;
			if (xhr.readyState !== 4) return;
			var headers = {
				call : "XMLHttpResponse",
				readyState : xhr.readyState, 
				status : xhr.status ? xhr.status : 0,
				statusText : xhr.statusText ? xhr.statusText : ""
			};
			if (callback) headers.callback = callback;
			var headerStr = xhr.getAllResponseHeaders();
			if (headerStr) akme.copyAll(headers, akme.xhr.parseHeaders(headerStr));
			var content = xhr.responseText ? xhr.responseText : "";
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
		var callbackFnOrOb = akme.getProperty(window, headers.callback);
		if (callbackFnOrOb && (headers.status == 200 || headers.status == 204 || headers.status == 304)) {
			if (/xml;|xml$/.test(headers["Content-Type"])) {
				var resx = content;
				try { resx = akme.parseXML(content, "application/xml"); }
				catch (er) { headers.status = 500; headers.statusText = String(er); }
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
				var reso = content;
				try { reso = akme.parseJSON(content); }
				catch (er) { headers.status = 500; headers.statusText = String(er); }
				akme.handleEvent(callbackFnOrOb, headers, reso);
			} // else if (/x-www-form-urlencoded;|x-www-form-urlencoded$/.test(headers["Content-Type"]))
			else {
				akme.handleEvent(callbackFnOrOb, headers, content);
			}
			return;
		}
		if (console.logEnabled) console.log(akme.formatJSON(headers)+"\n\n"+content);
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
		var reqHeaders = headers;
		headers = {
			call : "StorageResponse",
			method : reqHeaders.method,
			type : reqHeaders.type,
			key : reqHeaders.key
		};
		if (callback) headers.callback = callback;

		var result = this.formatMessage(headers, content);
		if (window.console) console.log(this.id+' '+location.protocol+'//'+location.host+' StorageRequest postMessage back '+ String(messageEvent.origin || origin));
		if (messageEvent.source) messageEvent.source.postMessage(result, messageEvent.origin);
		else source.postMessage(result, origin);
	},
	StorageResponse : function(headers, content) {
		var callbackFnOrOb = akme.getProperty(window, headers.callback);
		if (callbackFnOrOb) {
			akme.handleEvent(callbackFnOrOb, headers, akme.parseJSON(content));
			return;
		}
		if (console.logEnabled) console.log(akme.formatJSON(headers)+"\n\n"+content);
	},
	SubmitRequest : function(headers, ev) {
		var self = this;
		var elem = ev.target;
		// TODO: handle <a href=... target=...>...</a> in addition to <form ...>...</form>.
		var elemName = elem.nodeName.toLowerCase();
		if ("form" == elemName) {
			if (typeof elem.onsubmit === "function" && !elem.onsubmit(ev)) return nullResponse();
			var callback = elem.elements.callback;
			if (!callback) {
				callback = elem.ownerDocument.createElement("input");
				callback.setAttribute("type", "hidden");
				callback.setAttribute("name", "callback");
				elem.appendChild(callback);
			}
			callback.value = headers.callback;
			elem.submit();
			return;
		} else {
			if (console.logEnabled) console.log("submitAsync called with unknown Element ", elem);
			return nullResponse();
		}
		function nullResponse() {
			self.SubmitResponse({call:"SubmitResponse", callback:headers.callback}, null);
			return;
		}
	},
	SubmitResponse : function(headers, content) {
		var callbackFnOrOb = akme.getProperty(window, headers.callback);
		if (callbackFnOrOb) {
			if (/json;|json$/.test(headers["Content-Type"]) && content) content = akme.parseJSON(content);
			akme.handleEvent(callbackFnOrOb, headers, content);
		}
		else if (console.logEnabled) console.log(akme.formatJSON(headers)+"\n\n"+content);
	}
});
