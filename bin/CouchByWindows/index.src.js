// cross-origin/index.js

if (typeof console === "undefined") console = (document.documentMode && document.documentMode >= 8 && this.HTA) ? {
	log : function(text) { var elem = document.getElementById('logDiv'); if (!elem) return; elem.appendChild(document.createTextNode(text)); elem.appendChild(document.createElement('br')); },
	info : function(text) { console.log("* "+ text); },
	warn : function(text) { console.log("? "+ text); },
	error : function(text) { console.log("! "+ text); },
	assert : function(text) { if (!text) console.log("?! "+ text); }
} : { 
	log : function() {}, info : function() {}, warn : function() {}, error : function() {}, assert : function() {} 
};
if (typeof console.logEnabled === "undefined") console.logEnabled = false;

if (!Object.create) Object.create = (function(){
    function F(){};
    return function(o){
        if (arguments.length != 1) {
            throw new Error('Object.create implementation only accepts one parameter.');
        }
        F.prototype = o;
        return new F();
    };
})();
if ( !Object.getPrototypeOf ) {
	if ({}.hasOwnProperty("__proto__")) Object.getPrototypeOf = function(obj){ return obj.__proto__; };
	else Object.getPrototypeOf = function(obj){ return obj.constructor.prototype; };
}

if (!this.akme) this.akme = {
	THIS : this,
	onEvent : function (elem, /*String*/ type, /*function*/ fnOrHandleEvent) {
		if (elem.addEventListener) elem.addEventListener(type, fnOrHandleEvent, false);
		else if (elem.attachEvent) elem.attachEvent("on"+type, fnOrHandleEvent.handleEvent ? akme.fixHandleEvent(fnOrHandleEvent).handleEvent : fnOrHandleEvent);
	},
	fixHandleEvent : function (self) {
		if (!window.addEventListener && typeof self.handleEvent === "function" && !self.handleEvent_Fixed) {
			var handleEvent = self.handleEvent;
			self.handleEvent = function(ev) { handleEvent.call(self, ev); };
			self.handleEvent_Fixed = true;
		}
		return self;
	},
	getBaseHref : function() {
		var a = document.getElementsByTagName("base");
		return a.length != 0 ? a[0]["href"] : "";
	},
	parseJSON : function (text) {
		return JSON.parse(text);
	},
	formatJSON : function (obj) {
		return JSON.stringify(obj);
	},
	copy : function (obj, map, /*boolean*/ all) {
		if (map === null || typeof map === "undefined") return obj;
		all = !!all;
		for (var key in map) if (all || map.hasOwnProperty(key)) obj[key] = map[key];
		return obj;
	},
	copyAll : function (obj, map) { return this.copy(obj, map, true); },
	getProperty : function ( /*object*/ obj, /*Array or String*/ path, def ) {
		if ( typeof path === 'string' || path instanceof String ) { path = path.split('.'); }
		var prop = obj;
		var n = path.length;
		for (var i=0; i<n; i++) {
			if (prop != null && path[i] in prop) prop = prop[path[i]];
			else return def;
		}
		return prop;
	},
	setProperty : function ( /*object*/ obj, /*Array or String*/ path, val ) {
		if ( typeof path === 'string' || path instanceof String ) { path = path.split('.'); }
		var prop = obj;
		var n = path.length-1;
		for (var i=0; i<n; i++) {
			if (path[i] in prop) prop = prop[path[i]];
			else prop = prop[path[i]] = {};
		}
		prop[path[n]] = val;
		return prop;
	},
	extend : function (superNew, constructFn) {
		if (typeof constructFn === "object") {
			var x = superNew; superNew = constructFn; constructFn = x;
		}
		else if (!constructFn) constructFn = function(){};
		constructFn.prototype = typeof superNew === "function" ? Object.create(superNew.prototype) : superNew;
		constructFn.superstruct = constructFn.prototype.constructor;
		constructFn.prototype.constructor = constructFn;
		return constructFn;
	},
	extendDestroy : function (obj, destroyFn) {
		this.extendFunction(obj, "destroy", destroyFn, true);
	},
	extendFunction : function (obj, fcnName, fcn, latestFirst) {
		var old = obj[fcnName];
		if (old) {
			if (latestFirst) obj[fcnName] = function() { fcn.apply(this, arguments); old.apply(this, arguments); };
			else obj[fcnName] = function() { old.apply(this, arguments); fcn.apply(this, arguments); };
		}
		else obj[fcnName] = fcn;
	}
};

if (!akme.xhr) akme.xhr = {
	open : function(method, url, async) {
		var xhr = new XMLHttpRequest();
		xhr.open(method, url, async!=false);
		xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
		return xhr;
	},
	encodeMap : function(map) {
		var r = [];
		if (!map) return "";
		for (var key in map) r[r.length]=(encodeURIComponent(key)+'='+encodeURIComponent(map[key]));
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
	}
};


if (!akme.core) { akme.core = {}; akme.base = akme.core; }


/**
 * akme.base.EventSource
 * Provide simple event handling NOT related to DOM Events.
 * This is intended to be used via akme.base.EventSource.apply(this) to construct/inject functionality 
 * into objects rather than act as a prototype/super-static.
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.

	//
	// Private static declarations / closure
	//
	var PRIVATES = {}; // Closure guard for privates.

	//
	// Initialise constructor or singleton instance and public functions
	//
	function EventSource() {
		if (this.EVENTS) return; // One-time.
		if (console.logEnabled) console.log(this.constructor.CLASS+" injecting "+CLASS+" arguments.length "+ arguments.length);
		var p = {eventMap:{}}; // private closure
		// Use this.EVENTS for this injector/mixin to avoid conflicting with its related object this.PRIVATES.
		this.EVENTS = function(self) { return self === PRIVATES ? p : undefined; };
		this.onEvent = onEvent;
		this.unEvent = unEvent;
		this.doEvent = doEvent;

		$.extendDestroy(this, destroy);
	};
	$.extend(Object, $.copyAll(EventSource, {CLASS: CLASS}));
	$.setProperty($.THIS, CLASS, EventSource);
	
	//
	// Functions
	//

	function destroy() {
		if (console.logEnabled) console.log(this.constructor.CLASS+".destroy()");
		var p = this.EVENTS(PRIVATES);
		for (var key in p.eventMap) delete p.eventMap[key];
	}
	
	function onEvent(name, fnOrHandleEventOb, once) {
		if (!(typeof fnOrHandleEventOb === "function" || typeof fnOrHandleEventOb.handleEvent === "function")) {
			throw new TypeError(this.constructor.CLASS+".onEvent given neither function(ev){...} nor { handleEvent:function(ev){...} }");
		}
		var p = this.EVENTS(PRIVATES), a = p.eventMap[type];
		if (!a) { a = []; p.eventMap[type] = a; }
		var handler = $.fixHandleEvent(fnOrHandleEventOb);
		a.push({handler:handler, once:!!once});
	}

	function unEvent(name, fnOrHandleEventOb) {
		var p = this.EVENTS(PRIVATES), a = p.eventMap[type];
		if (!a) return;
		for (var i=0; i<a.length; i++) if (a[i].handler === fnOrHandleEventOb) { a.splice(i,1); }
	}

	function doEvent(ev) {
		var p = this.EVENTS(PRIVATES), a = p.eventMap[ev.type];
		if (a) for (var i=0; i<a.length; i++) {
			var eh = a[i];
			if (typeof eh.handler === "function") eh.handler.call(undefined, ev);
			else eh.handler.handleEvent.call(eh.handler, ev);
			if (eh.once) a.splice(i--,1);
		}
	}

})(fw,"akme.base.EventSource");


/**
 * akme.base.Storage
 * Provide underlying functions for akme.localStorage and akme.sessionStorage.
 * This gives the Storage API a collection/type name in addition to the key.
 * The underlying W3C Storage can be retrieved from akme.localStorage.getStorage() or akme.sessionStorage.getStorage().
 */
(function($,CLASS) {
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var SPLIT_CHAR = ':';
	
	//
	// Initialise instance and public functions
	//
	function Storage(STORAGE) {
		this.name = STORAGE.name;
		this.getStorage = function() { return STORAGE; }; // closure
		$.base.EventSource.apply(this); // Construct/inject functionality as a "brother from another mother".
	};
	$.setProperty($.THIS, CLASS, $.extend($.copyAll(
		Storage, {CLASS: CLASS}
	), {
		getItem : getItem,
		setItem : setItem,
		getItemJSON : getItemJSON,
		setItemJSON : setItemJSON,
		removeItem : removeItem,
		getAll : getAll,
		dump : dump,
		clean : clean,
		setAll : setAll,
		removeAll : removeAll,
		exportAll : exportAll,
		clear : clear
	}));
	
	//
	// Functions
	//
	
	/**
	 * Get an item value given the collection/type name and key.
	 */
	function getItem(/*string*/ type, /*string*/ key) { 
		var value = this.getStorage().getItem(type+SPLIT_CHAR+key);
		this.doEvent({ type:"getItem", keyType:type, key:key, value:value });
		return value;
	}
	
	/**
	 * Get an item value from storage, parsed as JSON, given the collection/type name and key.
	 */
	function getItemJSON(/*string*/ type, /*string*/ key) { 
		var value = this.getStorage().getItem(type+SPLIT_CHAR+key);
		if(value != null) value = akme.parseJSON(value);
		this.doEvent({ type:"getItem", keyType:type, key:key, value:value });
		return value;
	}
	
	/**
	 * Set the item value given the collection/type name and key.
	 */
	function setItem(/*string*/ type, /*string*/ key, /*string*/ value) { 
		if (value === undefined || value === "undefined") {
			this.removeItem(type, key);
		} else {
			this.getStorage().setItem(type+SPLIT_CHAR+key, value);
			this.doEvent({ type:"setItem", keyType:type, key:key, value:value });
		}
	}
	
	/**
	 * Set the item value object, which will be formatted and stored as a JSON string, given the collection/type name and key.
	 * The setItem event will contain the original object value.
	 */
	function setItemJSON(/*string*/ type, /*string*/ key, /*object*/ value) { 
		this.getStorage().setItem(type+SPLIT_CHAR+key, akme.formatJSON(value));
		this.doEvent({ type:"setItem", keyType:type, key:key, value:value });
	}

	/**
	 * Remove an item value given the collection/type name and key.
	 */
	function removeItem(/*string*/ type, /*string*/ key) { 
		this.getStorage().removeItem(type+SPLIT_CHAR+key); 
		this.doEvent({ type:"removeItem", keyType:type, key:key });
	}
	
	function getAll(/*string*/ type) {
		var storage = this.getStorage();
		var starts = type+SPLIT_CHAR;
		var count = 0;
		var result = {};
		for (var i=0; i<storage.size(); i++) {
			var key = storage.key(i);
			if (key.lastIndexOf(starts, starts.length) === 0) {
				result[key.substring(starts.length)] = storage.getItem(key);
				count++;
			}
		}
		this.doEvent({ type:"getAll", keyType:type, count:count, result:result });
		return result;
	}

	function setAll(/*string*/ type, /*object*/ map) {
		var storage = this.getStorage();
		var count = 0;
		for (var mapKey in map) {
			var key = type+SPLIT_CHAR+mapKey;
			storage.setItem(key, map[mapKey]);
			count++;
		}
		this.doEvent({ type:"setAll", keyType:type, count:count, map:map });
	}

	function removeAll(/*string*/ type) {
		var storage = this.getStorage();
		var starts = type+SPLIT_CHAR;
		var count = 0;
		for (var i=0; i<storage.size(); i++) {
			var key = storage.key(i);
			if (key.lastIndexOf(starts, starts.length) === 0) {
				storage.removeItem(key);
				i--;  // decrement index since we just removed an item
				count++;
			}
		}
		this.doEvent({ type:"removeAll", keyType:type, count:count });
	}
		
	function clean() {
		var storage = this.getStorage();
		for (var i=0; i<storage.size(); i++) {
			var key = storage.key(i);			
			storage.removeItem(key);			
		}
		this.doEvent({ type:"clean" });
	}
	
	function exportAll() {
		var storage = this.getStorage();
		var count = 0;
		var result = {};
		for (var i=0; i<storage.size(); i++) {
			var key = storage.key(i);
			result[key] = storage.getItem(key);
			count++;
		}
		this.doEvent({ type:"exportAll", count:count, result:result });
		return result;
	}
	
	function clear() {
		var storage = this.getStorage();
		var count = storage.size();
		storage.clear();
		this.doEvent({ type:"clear", count:count });
	}

	function dump(typesToOmitStr) {
		var typesToOmitAry = typesToOmitStr.split(',');
		var typesToOmit = {};
		for(var i=0; i<typesToOmitAry.length; i++) {
			typesToOmit[typesToOmitAry[i]] = 1;
		}
		var storage = this.getStorage();
		var count = 0;
		var result = {};
		for (var i=0; i<storage.size(); i++) {
			var key = storage.key(i);			
			var type = key.substring(0, key.indexOf(SPLIT_CHAR));
			if(typesToOmit[type] == 1) {
				continue;
			}
			result[key] = storage.getItem(key);
			count++;			
		}
		for(key in result) {
			storage.removeItem(key);
		}
		this.doEvent({ type:"dump", count:count, result:result });
		return result;
	}
	
})(fw,"akme.base.Storage");

/**
 * akme.localStorage
 */
if (!akme.localStorage) akme.localStorage = new akme.base.Storage({
	name : "akme.localStorage",
	length : typeof localStorage != "undefined" ? localStorage.length : 0,
	key : function(idx) { return localStorage.key(idx); },
	size : function() { return this.length = localStorage.length; }, // Change to size() to avoid .length vs .length() confusion.
	getItem : function(key) { return localStorage.getItem(key); },
	setItem : function(key, value) { localStorage.setItem(key, value); this.length = localStorage.length; },
	removeItem : function(key) { localStorage.removeItem(key); this.length = localStorage.length; },
	clear : function() { localStorage.clear(); this.length = localStorage.length; }
});

/**
 * akme.sessionStorage
 */
if (!akme.sessionStorage) akme.sessionStorage = new akme.base.Storage({
	name : "akme.sessionStorage",
	length : typeof sessionStorage != "undefined" ? sessionStorage : 0,
	key : function(idx) { return sessionStorage.key(idx); },
	size : function() { return this.length = sessionStorage.length; }, // Change to size() to avoid .length vs .length() confusion.
	getItem : function(key) { return sessionStorage.getItem(key); },
	setItem : function(key, value) { sessionStorage.setItem(key, value); this.length = sessionStorage.length; },
	removeItem : function(key) { sessionStorage.removeItem(key); this.length = sessionStorage.length; },
	clear : function() { sessionStorage.clear(); this.length = sessionStorage.length; }
});


/**
 * akme.base.MessageBroker 
 */
if (!akme.base.MessageBroker) akme.base.MessageBroker = akme.extend(akme.copy(function MessageBroker(cfg){
	this.id = cfg.id;
	this.allowOrigins = cfg.allowOrigins;
	this.defaultTimeout = cfg.defaultTimeout ? cfg.defaultTimeout : 45000;
}, {CLASS:"akme.base.MessageBroker"}), {
   	handleEvent : function(ev) { // ev.data, ev.domain, ev.source
   		var deny = true;
   		var hasDomain = location.hostname.indexOf(".") !== -1 || 
			location.hostname.indexOf(".local",location.hostname.length-6) == location.hostname.length-6;
   		if (ev.origin == location.href.substring(0, location.href.indexOf('/', 8)) ||
   	   			(!hasDomain && ev.origin.substring(ev.origin.indexOf('/')) ==
   	   				location.href.substring(location.href.indexOf('/'), location.href.indexOf('/', 8))
   	   			)) deny = false; // allow self both http and https
   		if (deny) for (var i=0; i<this.allowOrigins.length; i++) {
   			if (this.allowOrigins[i] === ev.origin && !(hasDomain && ev.origin.indexOf(".") === -1)) {
   				deny = false; break;
   			} 
   		}
   		if (deny) { console.log(this.id+" deny "+ ev.origin); return; }
   		var data = this.parseMessage(ev.data);
		if (!data.headers.call || typeof this[data.headers.call] !== 'function') return;
   		this[data.headers.call].call(this, data.headers, data.content, ev);
   	},
	formatHttpHeaderName : function(name) {
		var a = name.split("-");
		for (var i=0; i<a.length; i++) {
			a[i] = a[i].charAt(0).toUpperCase() + a[i].substring(1);
		}
		return a.join("-");
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
	XMLHttpRequest : function(headers, content, messageEvent) { //alert("XMLHttpRequest "+ String(messageEvent.origin) +" "+ akme.formatJSON(headers))
		// postMessage to an async XMLHttpRequest (or setTimeout) is tricky between IE8 and IE9.
		// IE9 and W3C browsers are fine to use the messageEvent in a delayed async response,
		// but IE8 wants separate closure variables for source and origin.  
		var xhr = akme.xhr.open(headers.method, headers.url, true);
		var callback = headers.callback;
		var source = messageEvent.source;
		var origin = messageEvent.origin;
		// allow timeout to be overriden by caller, incase they know if this may be a long running response
		var timeout = headers["timeout"] ? headers["timeout"] : this.defaultTimeout;
		
		delete headers["call"];
		delete headers["callback"];
		delete headers["method"];
		delete headers["url"];
		delete headers["timeout"];
		if (headers) for (var key in headers) xhr.setRequestHeader(key, headers[key]);
		var self = this; // closure
		
		var abortHandler;
		xhr.aborted = false; // set new property
		// setup abort mechanisms if a timeout is specified
		if (timeout > 0) {	
			//abort the XHR after 5 seconds or whatever was configured
			abortHandler = setTimeout(function() {
				if (window.console) console.log('aborting XHR');
				xhr.aborted = true;
				xhr.abort();
				var headers = {
						call : "XMLHttpResponse",
						readyState : 4, 
						status : 599,
						statusText : "599 Aborted"
				};
				if (callback) headers["callback"] = callback;
				var result = self.formatMessage(headers, "");
				if (window.console) console.log(self.id+' '+location.protocol+'//'+location.host+' XMLHttpRequest postMessage back '+ String(messageEvent.origin || origin));
				if (messageEvent.source) messageEvent.source.postMessage(result, messageEvent.origin);
				else source.postMessage(result, origin);
				self = xhr = callback = messageEvent = source = origin = null; // closure cleanup
			}, timeout);
		}
		
		xhr.onreadystatechange = function() {
			var xhr = this;
			if (xhr.readyState !== 4 || xhr.aborted) return;
			if (abortHandler) clearTimeout(abortHandler);
			var headers = {
				call : "XMLHttpResponse",
				readyState : xhr.readyState, 
				status : xhr["status"] ? xhr.status : 0,
				statusText : xhr["statusText"] ? xhr.statusText : ""
			};
			if (callback) headers["callback"] = callback;
			var headerStr = xhr.getAllResponseHeaders();
			if (headerStr) {
				var headerAry = headerStr.split("\n");
				for (var i=0, pos=0; i<headerAry.length && headerAry[i]>" "; i++) {
					pos = headerAry[i].indexOf(": ");
					headers[self.formatHttpHeaderName(headerAry[i].substring(0,pos))] = headerAry[i].substring(pos+2).split("\r")[0];
				}
			}
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
	StorageRequest : function(headers, content, messageEvent) {
		var storage = akme.localStorage;
		var callback = headers.callback;
		var source = messageEvent.source;
		var origin = messageEvent.origin;
		
		if (content) {
			content = storage[headers.method](headers.type, headers.key, content);
		} else {
			content = storage[headers.method](headers.type, headers.key);
		}
		
		if (typeof content === 'object') {
			content = akme.formatJSON(content);
		}
		
		var reqHeaders = headers;
		var headers = {
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
	WindowOpenRequest : function(headers, content, messageEvent) {
		var callback = headers.callback;
		var urlOrigin = headers.url.substring(0, headers.url.indexOf('/', 8));
		var locationOrigin = location.protocol+"//"+location.hostname;
   		var deny = true;
   		var hasDomain = location.hostname.indexOf(".") !== -1;
   		for (var i=0; i<this.allowOrigins.length; i++) {
   			if (this.allowOrigins[i] === urlOrigin && !(hasDomain && urlOrigin.indexOf(".") === -1)) {
   				deny = false; break;
   			}
   		}
   		//if (deny) { console.warn(this.id+" deny "+ messageEvent.origin); return; }

   		var sessionMap = {};
		if (headers.target != "_self") {
			var xhr = akme.xhr.open("POST", "sessionId.jsp", false);
			xhr.send();
			if (xhr.status != 200) {
				console.error(this.id+" "+location.protocol+"//"+location.host+" WindowOpenRequest ER "+ xhr.status +" "+ xhr.statusText);
				return;
			}
			sessionMap = akme.xhr.decodeUrlEncoded(xhr.responseText);
		}
		var ID_NAME = "j_sessionId", IDSSO_NAME = "j_sessionIdSso";
		var form = document.createElement("form");
		form.setAttribute("style","display:none;");
		form.setAttribute("name","WindowOpenRequest");
		form.setAttribute("method","POST");
		form.setAttribute("action",urlOrigin+"/afsignon/public/signon.jsp");
		form.setAttribute("target",headers.target);
		form.appendChild(akme.copy(document.createElement("input"), {type:"hidden", name:ID_NAME, value:sessionMap[ID_NAME]}));
		if (sessionMap[IDSSO_NAME]) form.appendChild(akme.copy(document.createElement("input"), {type:"hidden", name:IDSSO_NAME, value:sessionMap[IDSSO_NAME]}));
		var langIdx = headers.url.indexOf("lang=", headers.url.length-12);
		if (langIdx != -1) {
			var lang = headers.url.substring(langIdx + "lang=".length);
			form.appendChild(akme.copy(document.createElement("input"), {type:"hidden", name:"lang", value:lang}));
			// Older AFR code still uses language= rather than lang=.
			headers.url = headers.url.substring(0, langIdx)+"language="+lang;
		}
		form.appendChild(akme.copy(document.createElement("input"), {type:"hidden", name:"j_sessionUrl", value:headers.url}));
		var body = document.getElementsByTagName("body")[0];
		body.appendChild(form);
		console.info("WindowOpenRequest target "+ headers.target +" j_sessionUrl "+ headers.url);
		setTimeout(function() {
			form.submit();
			if (document.documentMode && document.documentMode < 9) { // IE8 memory leak
				var recycleBin = document.getElementById("recycleBin");
				if (!recycleBin) { recycleBin = document.createElement("div"); body.appendChild(recycleBin); }
				recycleBin.appendChild(form);
				recycleBin.innerHTML = "";
			} else body.removeChild(form);
		}, 100);
		
		var reqHeaders = headers;
		var headers = {
			call : "WindowOpenResponse",
			method : reqHeaders.method,
			type : reqHeaders.type,
			key : reqHeaders.key
		};
		if (callback) headers.callback = callback;

		var result = this.formatMessage(headers, content);
		if (window.console) console.log(this.id+' '+location.protocol+'//'+location.host+' WindowOpenRequest postMessage back '+ String(messageEvent.origin || origin));
		if (messageEvent.source) messageEvent.source.postMessage(result, messageEvent.origin);
		else source.postMessage(result, origin);
	}
});
