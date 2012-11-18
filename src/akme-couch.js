/*
		var shiftAccess = new akme.core.CouchAccess("shiftdb", "../proxy/couchdb.jsp?/shiftdb");
		shiftAccess.key = function(location, date, time) {
			return location+"_"+date+"_"+time;
		};
		cx.set('shiftAccess', shiftAccess);
 */

/**
 * akme.core.CouchAccess
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var CONTENT_TYPE_JSON = "application/json";
		//CONTENT_TYPE_URLE = "application/x-www-form-urlencoded";
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	function CouchAccess(name, url) {
		this.name = name;
		this.url = url;
		var dataConstructor = $.getProperty($.THIS, name);
		if (typeof dataConstructor === "function") this.dataConstructor = dataConstructor;
		$.core.EventSource.apply(this); // Apply/inject/mix EventSource functionality into this.
		//$.extendDestroy(this, function(){});
	};
	$.extend($.copyAll(
		CouchAccess, {CLASS: CLASS}
	), $.copyAll(new $.core.Access, {
		findOne : findOne, // given Object return Object
		info : info, // given key return Object
		read : read, // given key return Object
		write : write, // given key, Object return Object
		remove : remove // given key return Object
	}));
	$.setProperty($.THIS, CLASS, CouchAccess);
	
	//
	// Functions
	//
	
	function reviver(key, value) {
		if ("jsonReviver" in this.constructor) return this.constructor.jsonReviver.call(this, key, value);
		else return value;
	}
	
	function replacer(key, value) {
		if ("jsonReplacer" in this.constructor) return this.constructor.jsonReplacer.call(this, key, value);
		else return value;
	}
	
	function callWithRetry(method, url, headers, content) {
		//var self = this;
		var xhr = null;
		for (var i=0; i<1; i++) { // take away re-try to implement server-side but leave here as example
			if (i!=0) {
				//var xhr2 = authorize();
				//if (xhr2.status >= 400) break;
			}
			xhr = akme.xhr.open(method, url, false);
			for (var key in headers) xhr.setRequestHeader(key, headers[key]);
			if (typeof content !== "undefined" && content !== null) xhr.send(content);
			else xhr.send();
			if (xhr.status != 401) break;
		}
		return xhr;
	}

	function findOne(map) {
		var ary = this.find(map);
		return ary.length === 0 ? ary[0] : null;
	}
	
	/**
	 * Just get an Object/Map of the HEAD/header info related to the key including the ETag or ver (ETag less the quotes).
	 */
	function info(key) {
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callWithRetry("HEAD", url, {"Accept": CONTENT_TYPE_JSON}, null);
		var ver = xhr.getResponseHeader("ETag");
		var headers = {id: key, ver: (ver ? ver.replace(/^"|"$/g, "") : null), 
				status: xhr.status, statusText: xhr.statusText};
		for (var name in {"Cache-Control":1,"Content-Encoding":1,"Content-Length":1,"Content-Type":1,
				"Date":1,"ETag":1,"Expires":1,"Last-Modified":1,"Pragma":1,"Server":1,"Vary":1}) {
			var val = xhr.getResponseHeader(name);
			if (val) headers[name] = val;
		}
		if (console.logEnabled) console.log("HEAD "+ url, xhr.status, xhr.statusText, headers["ver"]);
		this.doEvent({ type:"info", keyType:this.name, key:key, info:headers });
		return headers;
	}
	
	/**
	 * This maintains a copy of the key/value in sessionStorage.
	 */
	function read(key) { //if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callWithRetry("GET", url, {"Accept": CONTENT_TYPE_JSON}, null);
		var type = akme.xhr.getResponseContentType(xhr);
		if (console.logEnabled) console.log("GET "+ url, xhr.status, xhr.statusText, type);
		var value = (xhr.status < 400 && type.indexOf(CONTENT_TYPE_JSON)==0) ? xhr.responseText : null;
		if (value) {
			akme.sessionStorage.setItem(self.name, key, value);
			value = akme.parseJSON(value, reviver);
		} else {
			akme.sessionStorage.removeItem(self.name, key);
		}
		if (this.dataConstructor && value) value = new this.dataConstructor(value);
		this.doEvent({ type:"read", keyType:this.name, key:key, value:value });
		return value;
	}

	/**
	 * This maintains a copy of the key/value in sessionStorage.
	 * This is so the caller doesn't have to manage the _id and _rev directly that are required to PUT in CouchDB.
	 */
	function write(key, value) { //if (console.logEnabled) console.log(this.name +".write("+ key +",...)");
		var self = this;
		var valueMap = akme.sessionStorage.getItemJSON(self.name, key);
		if (valueMap && valueMap._id) {
			value._id = valueMap._id;
			value._rev = valueMap._rev;
		}
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callWithRetry("PUT", url, 
				{"Accept": CONTENT_TYPE_JSON, "Content-Type": CONTENT_TYPE_JSON}, 
				typeof value == "string" ? value : akme.formatJSON(value, replacer));
		var type = akme.xhr.getResponseContentType(xhr);
		if (console.logEnabled) console.log("PUT "+ url, xhr.status, xhr.statusText, type);
		var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? akme.parseJSON(xhr.responseText) : xhr.responseText;
		if (result.ok && result.rev) {
			value._id = result.id;
			value._rev = result.rev;
			akme.sessionStorage.setItem(self.name, key, akme.formatJSON(value, replacer));
		}
		this.doEvent({ type:"write", keyType:this.name, key:key, value:value });
		return result;
	}
	
	/**
	 * Remove the given revision or the latest if no rev is given.
	 */
	function remove(key, rev) { //if (console.logEnabled) console.log(this.name +".remove("+ key +")");
		// TODO: KM: Perhaps change from a DELETE to just a save-empty with just key-rev?
		// Save-empty rather than delete would reduce the 404 responses, but then there are blank records, normally a bad thing.
		var self = this;
		if (!rev) {
			var url = self.url+"/"+encodeURIComponent(key);
			var xhr = callWithRetry("HEAD", url, {"Accept": CONTENT_TYPE_JSON});
			rev = xhr.getResponseHeader("ETag");
			if (rev) rev = rev.replace(/^"|"$/g, "");
			if (!rev) rev = "";
		}
		var url = self.url+"/"+encodeURIComponent(key)+"?rev="+encodeURIComponent(rev);
		var xhr = callWithRetry("DELETE", url, {"Accept": CONTENT_TYPE_JSON});
		var type = akme.xhr.getResponseContentType(xhr);
		if (console.logEnabled) console.log("DELETE "+ url, xhr.status, xhr.statusText, type);
		var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? akme.parseJSON(xhr.responseText) : xhr.responseText;
		if (result.ok && result.rev) {
			akme.sessionStorage.removeItem(self.name, key);
		}
		this.doEvent({ type:"remove", keyType:this.name, key:key });
		return result;
	}
	
})(akme,"akme.core.CouchAccess");


/**
 * akme.core.CouchAsyncAccess
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var CONTENT_TYPE_JSON = "application/json";
		//CONTENT_TYPE_URLE = "application/x-www-form-urlencoded";
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	function CouchAsyncAccess(name, url) {
		this.name = name;
		this.url = url;
		var dataConstructor = $.getProperty($.THIS, name);
		if (typeof dataConstructor === "function") this.dataConstructor = dataConstructor;
		$.core.EventSource.apply(this); // Apply/inject/mix EventSource functionality into this.
		//$.extendDestroy(this, function(){});
	};
	$.extend($.copyAll(
		CouchAsyncAccess, {CLASS: CLASS}
	), $.copyAll(new $.core.Access, {
		findOne : findOne, // given Object return Object
		info : info, // given key return Object
		read : read, // given key return Object
		write : write, // given key, Object return Object
		remove : remove // given key return Object
	}));
	$.setProperty($.THIS, CLASS, CouchAsyncAccess);
	
	//
	// Functions
	//
	
	function reviver(key, value) {
		if ("jsonReviver" in this.constructor) return this.constructor.jsonReviver.call(this, key, value);
		else return value;
	}
	
	function replacer(key, value) {
		if ("jsonReplacer" in this.constructor) return this.constructor.jsonReplacer.call(this, key, value);
		else return value;
	}

	function callAsync(method, url, headers, content, callbackFnOrOb) {
		var xhr = new XMLHttpRequest();
		callAsyncXHR(xhr, method, url, headers, content, callbackFnOrOb);
		return xhr;
	}

	function callAsyncXHR(xhr, method, url, headers, content, callbackFnOrOb) {
		xhr.open(method, url, true);
		xhr.setRequestHeader("X-Requested-With","XMLHttpRequest");
		for (var key in headers) xhr.setRequestHeader(key, headers[key]);
		xhr.onreadystatechange = function() { 
			var xhr=this; 
			if (xhr.readyState==4) akme.handleEvent(callbackFnOrOb, {type:"readystatechange", target:xhr}); 
		};
		if (typeof content !== "undefined") xhr.send(content);
		else xhr.send();
		return;
	}
	
	function findOne(map) {
		var ary = this.find(map);
		return ary.length === 0 ? ary[0] : null;
	}
	
	/**
	 * Just get an Object/Map of the HEAD/header info related to the key including the ETag or ver (ETag less the quotes).
	 */
	function info(key, /*function(result)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("HEAD", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var ver = xhr.getResponseHeader("ETag");
			var headers = {id: key, ver: (ver ? ver.replace(/^"|"$/g, "") : null), 
				status: xhr.status, statusText: xhr.statusText};
			for (var name in {"Cache-Control":1,"Content-Encoding":1,"Content-Length":1,"Content-Type":1,
					"Date":1,"ETag":1,"Expires":1,"Last-Modified":1,"Pragma":1,"Server":1,"Vary":1}) {
				var val = xhr.getResponseHeader(name);
				if (val) headers[name] = val;
			}
			if (console.logEnabled) console.log("HEAD "+ url, xhr.status, xhr.statusText, headers["ver"]);
			self.doEvent({ type:"info", keyType:self.name, key:key, info:headers });
			akme.handleEvent(callbackFnOrOb, headers);
			self = xhr = key = callbackFnOrOb = null; // closure cleanup 
		}
		return xhr;
	}

	/**
	 * This maintains a copy of the key/value in sessionStorage.
	 */
	function read(key, /*function(result)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("GET", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var type = akme.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("GET "+ url, xhr.status, xhr.statusText, type);
			var value = (xhr.status < 400 && type.indexOf(CONTENT_TYPE_JSON)==0) ? xhr.responseText : null;
			if (value) {
				akme.sessionStorage.setItem(self.name, key, value);
				value = akme.parseJSON(value, reviver);
			} else {
				akme.sessionStorage.removeItem(self.name, key);
			}
			if (self.dataConstructor && value) value = new self.dataConstructor(value);
			self.doEvent({ type:"read", keyType:self.name, key:key, value:value });
			akme.handleEvent(callbackFnOrOb, value);
			self = xhr = key = callbackFnOrOb = null; // closure cleanup 
		}
		return xhr;
	}

	/**
	 * This maintains a copy of the key/value in sessionStorage.
	 * This is so the caller doesn't have to manage the _id and _rev directly that are required to PUT in CouchDB.
	 */
	function write(key, value, /*function(result)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".write("+ key +",...)");
		var self = this;
		var valueMap = akme.sessionStorage.getItemJSON(self.name, key);
		if (valueMap && valueMap._id) {
			value._id = valueMap._id;
			value._rev = valueMap._rev;
		}
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("PUT", url, 
				{"Accept": CONTENT_TYPE_JSON, "Content-Type": CONTENT_TYPE_JSON}, 
				typeof value == "string" ? value : akme.formatJSON(value, replacer),
				handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var type = akme.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("PUT "+ url, xhr.status, xhr.statusText, type);
			var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? akme.parseJSON(xhr.responseText) : xhr.responseText;
			if (result.ok && result.rev) {
				value._id = result.id;
				value._rev = result.rev;
				akme.sessionStorage.setItem(self.name, key, akme.formatJSON(value, replacer));
			}
			self.doEvent({ type:"write", keyType:self.name, key:key, value:value });
			akme.handleEvent(callbackFnOrOb, result);
			self = xhr = key = value = callbackFnOrOb = null; // closure cleanup 
		};
		return xhr;
	}
	
	/**
	 * Remove the given revision or the latest if no rev is given.
	 * Given the complexity of multiple async it's better to move the HEAD server-side just like authentication. 
	 */
	function remove(key, rev, /*function(result)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".remove("+ key +")");
		// Save-empty rather than delete would reduce the 404 responses, but then there are blank records, normally a bad thing.
		var self = this; // closure
		var xhr = new XMLHttpRequest(); // closure
		var url = null; // closure
		if (!rev) {
			url = self.url+"/"+encodeURIComponent(key); 
			callAsyncXHR(xhr, "HEAD", url, {"Accept": CONTENT_TYPE_JSON}, null, handleStateHEAD);
		} else {
			callDELETE();
		}
		function handleStateHEAD(ev) {
			var xhr = ev.target;
			rev = xhr.getResponseHeader("ETag");
			if (rev) rev = rev.replace(/^"|"$/g, "");
			if (!rev) rev = "";
			callDELETE();
		};
		function callDELETE() {
			url = self.url+"/"+encodeURIComponent(key)+"?rev="+encodeURIComponent(rev);
			callAsyncXHR(xhr, "DELETE", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		};
		function handleState(ev) {
			xhr = ev.target;
			var type = akme.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("DELETE "+ url, xhr.status, xhr.statusText, type);
			var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? akme.parseJSON(xhr.responseText) : xhr.responseText;
			if (result.ok && result.rev) {
				akme.sessionStorage.removeItem(self.name, key);
			}
			self.doEvent({ type:"remove", keyType:self.name, key:key });
			akme.handleEvent(callbackFnOrOb, result);
			self = xhr = url = key = rev = callbackFnOrOb = null; // closure cleanup
		};
		return xhr;
	}
	
})(akme,"akme.core.CouchAsyncAccess");
