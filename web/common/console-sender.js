// console-sender.js - send console.log/info/warn/error events to a remoteURL
//

/**
 * Buffer console.log/info/warn/error and send remotely if so configured.
 * If remoteURL is configured only error level logs will be sent.
 * If remoteLevel is configure only those level logs or higher will be sent {"log":1,"info":3,"warn":4,"error":5}.
 * MSIE/Trident, even 10, does not support console.debug.
 * 
 * TODO: Only provide Authorization once as a re-try, assuming *_token cookie will handle it thereafter.
 * TODO: If even the AUthorization re-try fails, purge the logs to be sent.
 * TODO: Encapsulate behind a function, console.akme() / console.akme({}) style, but still publish *Local methods.
 * 	
	console.akme({
		authUser : form.user.value,
		authPass : form.pass.value,
		remoteURL : "/akme-js/log/console-receiver",
		remoteLevel : "error",
		localLevel : null
	});
	// remoteRegExp : null

 */
(function($,console){
	if (!console || console.logLocal) return; // One-time.

	//
	// private closure variables 
	//
	var	//"debug":2, //console.debug not in MSIE10
		LOG_EVENTS = {"log":1,"info":3,"warn":4,"error":5}, 
		SEND_TIMEOUT = 5*1000,
		RECV_TIMEOUT = 45*1000,
		CHECK_TIMEOUT = 15*60*1000,
		MIME_TYPE = "application/json; charset=iso-8859-1",
		tridentPos = navigator.userAgent.indexOf(" Trident/"),
		isIE = tridentPos != -1,
		isIE9 = / Trident\/[45]\./.test(navigator.userAgent.substring(tridentPos,tridentPos+11)),
		timer = null,
		storage = $.sessionStorage,
		itemType = "console",
		NAMES = {
			"localLevel":1,
			"remoteLevel":1,
			"remoteAttemptDate":1,
			"remoteSuccessDate":1,
			"remoteRegExp":1,
			"remoteUser":1 };
	
	//
	// public constructor/injector/singleton
	//
	var self = {
			sendTimeout: SEND_TIMEOUT,
			recvTimeout: RECV_TIMEOUT,
			checkTimeout: CHECK_TIMEOUT,
			remoteLevel: "error",
			clear: clear };
	
	for (var key in NAMES) self[key] = storage.getItem(itemType, key) || self[key];
	if (self.remoteRegExp) setRemoteRegExp(self.remoteRegExp);
	for (var key in LOG_EVENTS) (function(key){
		console[key+"Local"] = console[key];
		console[key] = function(){
			if (self.remoteURL && testLevel(self.remoteLevel, key) && (!self.remoteUser || self.remoteUser==self.authUser)) {
				if (testRegExp(self.remoteRegExp, arguments)) {
					defer.apply(undefined,$.concat([key],arguments));
				}
			}
			var result = undefined;
			if (! self.localLevel || testLevel(self.localLevel, key)) {
				if (isIE) for (var i=0; i<arguments.length; i++) {
					if (typeof arguments[i]==="object") arguments[i] = $.formatJSON(arguments[i]);
				}
				result = isIE9 ? console[key+"Local"]($.concat([],arguments)) : console[key+"Local"].apply(console,arguments);
			}
			checkLevel();
			return result;
		};
	})(key);
//console.logLocal("remoteRegExp", self.remoteRegExp)

	// Publish API for console.akme() (getter) and console.akme({remoteURL:"",...}) setter for the singleton.
	console.akme = function(map) {
		if (map instanceof Object) {
			$.copy(self, map);
			for (key in NAMES) if (map[key] !== undefined) {
				if (map[key] !== null) storage.setItem(itemType, key, self[key]);
				else storage.removeItem(itemType, key);
			}
		}
		return self;
	};
	
	//
	// helper functions
	//
	
	function testLevel(level, key) {
		return LOG_EVENTS[level] && LOG_EVENTS[key] >= LOG_EVENTS[level];
	}
	function testRegExp(re, args) {
		return ! re || (re instanceof RegExp && (
				(args instanceof Array && args.length != 0 && re.test(args[0])) ||
				re.test(args)
				));
	}
	function setRemoteRegExp(re) {
		if (re==null || re=="") removeSelfAndStore("remoteRegExp");
		else try { setSelfAndStore("remoteRegExp", re instanceof RegExp ? re : new RegExp(re.replace(/^\/|\/$/g,""))); }
		catch (er) { setSelfAndStore("remoteRegExp", null); }
	}
	
	function setSelfAndStore(key, val) {
		self[key] = val;
		storage.setItem(itemType, key, val);
	}
	function removeSelfAndStore(key) {
		delete self[key];
		storage.removeItem(itemType, key);
	}

	/**
	 * Remove related storage entries, including pending logs and last known contact timestamps with the server.
	 */
	function clear() {
		delete self.remoteAttemptDate;
		delete self.remoteSuccessDate;
		storage.removeAll(itemType);
	}
	
	/**
	 * Check the X-Log-Level setting with the server.
	 * Do this initially and then every 15 minutes or similarly configurable upon console events/calls.
	 */
	function checkLevel() {
		if (timer) return; // Already queued to call server.
		var nowMillis = getTimeIfGreaterThanMillis(self.checkTimeout);
		if (typeof nowMillis === "number") defer("check",nowMillis);
	};
	
	/**
	 * Returns new Date().getTime() if it's absolute difference is greater than the given millis, otherwise null.
	 */
	function getTimeIfGreaterThanMillis(millis) {
		var nowMillis = new Date().getTime();
		var remoteMillis = self.remoteSuccessDate || self.remoteAttemptDate;
//console.logLocal("getTimeIfGreaterThanMillis", nowMillis, remoteMillis, Math.abs(nowMillis-remoteMillis), self.checkTimeout)
		return (console.remoteURL && (!remoteMillis || 
				Math.abs(nowMillis-remoteMillis) >= millis)) ? nowMillis : null;
	};
	
	/**
	 * Store the console log event asynchronously and send later.
	 */
	function defer() {
		var args = $.concat([],arguments);
		var len = storage.getItem(itemType, "length") || 0;
		storage.setItem(itemType, "length", ++len);
		storage.setItemJSON(itemType, len-1, args);
		if (!timer) timer = setTimeout(send, self.sendTimeout);
	};
	
	/**
	 * Send the stored console logs, typically called by a Timeout.
	 */
	function send() {
		if (timer) { clearTimeout(timer); timer = null; }
		if (!self.remoteURL) return;
		var len = storage.getItem(itemType, "length") || 0;
		var a = [], worstEvent = "log";
		for (var i=0; i<len; i++) {
			a[i] = storage.getItemJSON(itemType, i);
			var itemEvent = a[i] && a[i].length > 0 ? a[i][0] : null;
			if (itemEvent && LOG_EVENTS[itemEvent] > LOG_EVENTS[worstEvent]) worstEvent = itemEvent;
		}
		
		var url = self.remoteURL+"."+worstEvent;
		var user = self.authUser, pass = self.authPass;
		var tryCount = 0;
		trySend();
		
		// Only provide Authorization once as a re-try, assuming *_token cookie will handle it thereafter.
		function trySend() {
			tryCount++;
			// Give up if we tried more than twice.
			if (tryCount > 2) return;
			// MSIE10+HTML5 has Base64 btoa (to ASCII) and atob (to Binary) and use library to cover older browsers.
			var headers = {
				"Content-Type": MIME_TYPE,
				"X-Log-Level": self.remoteLevel || ""};
			if (self.localLevel) headers["X-Log-Local-Level"] = self.localLevel;
			if (self.removeRegExp) headers["X-Log-RegExp"] = self.removeRegExp;
			if (tryCount==2 || !(self.remoteSuccessDate || self.remoteAttemptDate) ||
					typeof getTimeIfGreaterThanMillis(self.checkTimeout) == "number") {
				headers["Authorization"] = "Basic "+ btoa(user+":"+pass);
			}
			setSelfAndStore("remoteAttemptDate", new Date().getTime());
			removeSelfAndStore("remoteSuccessDate");
			//method, url, headers, content, /*function(headers,content)*/ callbackFnOrOb
			var xhr = $.xhr.callAsync("POST", url, headers, a, tryReceive);
			setTimeout(function(){ if (xhr) xhr.abort(); }, self.recvTimeout);
			if (tryCount==1) {
				// Only need to remove sent items on the first try.
				storage.removeAll(itemType);
				for (var key in NAMES) if (self[key] != null) storage.setItem(itemType, key, self[key]);
				checkLevel(); // setTimeout check for later
			}
			
			function tryReceive(headers,content) {
				if (!headers.status || headers.status >= 400) {
					if (tryCount==1 && headers.status == 401) trySend(); // Retry one time with Authorization.
					return;
				}
				setSelfAndStore("remoteSuccessDate", new Date().getTime());
				var logLevel = headers["X-Log-Local-Level"];
				if (logLevel && LOG_EVENTS[logLevel] >= LOG_EVENTS["log"]) {
					setSelfAndStore("localLevel", logLevel);
				}
				logLevel = headers["X-Log-Level"];
				if (logLevel && LOG_EVENTS[logLevel] >= LOG_EVENTS["log"]) {
					setSelfAndStore("remoteLevel", logLevel);
				}
				var logRegExp = headers["X-Log-RegExp"];
				if (logRegExp != null) setRemoteRegExp(logRegExp);
				console.logLocal("POST "+ url +" response ", 
					isIE?"\n"+$.formatJSON(headers):headers, 
					isIE?"\n"+$.formatJSON(content):content);
			};
			
		}
			
	};
	
})(akme,console);