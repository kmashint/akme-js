// akme-core.js
// Javascript Types: undefined, null, boolean, number, string, function, or object; Date and Array are typeof object.
// Javascript typeof works for a function or object but note typeof String(1) is string yet typeof new String(1) is object.
// instanceof is better, but will not work between frames/windows/js-security-contexts due to different underlying prototypes.
// This limitation of instanceof is another reason to use postMessage between frames.

// Simple ability to ensure console.log and allow for use of if (console.logEnabled).
// http://www.tuttoaster.com/learning-javascript-and-dom-with-console/
// http://www.thecssninja.com/javascript/console

// Add safe (from side-effects) compatibility to built-in JS constructor functions like Object, Function, Array.
(function(){
	'use strict';
	
	var NOOP = function(){},
		ARRAY = Array.prototype,
		SLICE = Array.prototype.slice;

	if (typeof console === "undefined") console = {
			log: NOOP, debug: NOOP, info: NOOP, warn: NOOP, error: NOOP, assert: NOOP
		};
	if (typeof console.logEnabled === "undefined") console.logEnabled = false;
	
	/**
	 * Utility method on functions to return a short version of a dot-delimited constructor name.
	 * Useful for constructor functions, e.g. with obj.constructor.name as "akme.core.EventSource" 
	 * and obj.constructor.getShortName() gives "Event".
	 * If given a parameter, it will look for a name on that function, or object, instead of this function.
	 */
	if (!Function.prototype.getShortName) Function.prototype.getShortName = function (fn) {
		var name = String(fn ? fn.name : this.name);
		if (name) return name.substring(name.lastIndexOf('.')+1);
		else return;
	};
	
	/**
	 * Add Function.prototype.bind() if not available.
	 * Extension to provide a function whose context is bound to a specific object, part of ECMAScript 5.
	 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
	 */
	if (!Function.prototype.bind) Function.prototype.bind = function (oThis) {  
	      if (typeof this !== "function") {  
	        // closest thing possible to the ECMAScript 5 internal IsCallable function  
	        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");  
	      }  
	    
	      var fSlice = Array.prototype.slice,  
	          aArgs = fSlice.call(arguments, 1),   
	          fToBind = this,   
	          fNOP = function () {},  
	          fBound = function () {  
	            return fToBind.apply(this instanceof fNOP  
	                                   ? this  
	                                   : oThis || window,  
	                                 aArgs.concat(fSlice.call(arguments)));  
	          };  
	    
	      fNOP.prototype = this.prototype;  
	      fBound.prototype = new fNOP();  
	    
	      return fBound;  
	};

	/**
	 * Return values related to hasOwnProperty keys.
	 */
	if (!Object.values) Object.values = function(obj) {
		var v = [], k = Object.keys(obj);
		for (var i=0; i<k.length; i++) v.push(obj[k[i]]);
		return v;
	};

	/**
	 * Perform a binary search of an array for an object assuming the array is already sorted.
	 */
	if (!Array.binarySearch) Array.binarySearch = function (a,o) {
	    var l = 0, u = a.length, m = 0;
	    while ( l <= u ) { 
	        if ( o > a[( m = Math.floor((l+u)/2) )] ) l = m+1;
	        else u = (o == a[m]) ? -2 : m - 1;
	    }
	    return (u == -2) ? m : -1;
	};

	//
	// Cross-reference JS 1.5 Array methods against the JS 1.3 Array constructor for backwards compatibility.
	//
	for (var key in {"indexOf":1,"lastIndexOf":1,"every":1,"filter":1,"forEach":1,"map":1,"some":1,"reduce":1,"reduceRight":1}){
		(function(key) {
			if (!Array[key]) Array[key] = function(ary) { return ARRAY[key].apply(ary, SLICE.call(arguments,1)); }; 
		})(key);
	}

})();


//
// Define various convenience methods directly on the akme root object.
//
if (!this.akme) this.akme = {
	THIS : this, // reference the global object, e.g. will be window in a web browser
	WHITESPACE_TRIM_REGEXP : /^\s*|\s*$/gm,
	PRINTABLE_EXCLUDE_REGEXP : /[^\x20-\x7e\xc0-\xff]/g,
	MILLIS_IN_HOUR : 60*60000,
	MILLIS_IN_DAY : 24*60*60000,
	
	noop: function(){},
	slice : Array.prototype.slice,

	/**
	 * Check if the object is not undefined (primitive) and not null (object).
	 */
	isDefinedNotNull : function(x) { return typeof x !== "undefined" && x !== null; },
	/**
	 * Check if the object is instanceof Array (object, there is no typeof array primitive).
	 */
	isArray : Array.isArray || function(x) { return x instanceof Array; },
	/**
	 * Check if the object is typeof boolean (primitive) or instanceof Boolean (object).
	 */
	isBoolean : function(x) { return typeof x === "boolean" || x instanceof Boolean; },
	/**
	 * Check if the object is instanceof Date (object, there is no typeof date primitive).
	 */
	isDate : function(x) { return x instanceof Date; },
	/**
	 * Check if the object is typeof function (a typeof function is also instanceof Object and instanceof Function unlike other typeof primitives).
	 */
	isFunction : function(x) { return typeof x === "function"; },
	/**
	 * Check if the object is typeof number (primitive) or instanceof Number (object).
	 */
	isNumber : function(x) { return typeof x === "number" || x instanceof Number; },
	/**
	 * Check if the object is typeof string (primitive) or instanceof String (object).
	 */
	isString : function(x) { return typeof x === "string" || x instanceof String; },
	/**
	 * Concat a collection to an array and return it, helpful for HTMLCollection results of getElementsByTagName.
	 */
	concat : function (ary /*, coll, ... */) {
		for (var j=1; j<arguments.length; j++) { var coll = arguments[j];
			for (var i=0; i<coll.length; i++) ary[ary.length]=(coll[i]);
		}
		return ary;
	},
	/**
	 * Helper to delete all Array or Object.hasOwnProperty elements.
	 */
	deleteAll : function(aryOrMap) {
		if (aryOrMap instanceof Array) aryOrMap.length = 0;
		else for (var key in aryOrMap) if (aryOrMap.hasOwnProperty(key)) delete aryOrMap[key];
	},
	/**
	 * Shallow clone as in Java, returning a new/cloned obj.
	 * Uses Object.create(Object.getPrototypeOf(obj)) and then copies hasOwnProperty/non-prototype properties by key.
	 */
	clone : function (obj) {
		if (obj === undefined || obj === null) return obj;
		if (typeof obj.clone === "function") return obj.clone();
		var clone = Object.create(Object.getPrototypeOf(obj));
		for (var key in obj) if (obj.hasOwnProperty(key)) clone[key] = obj[key];
		return clone;
	},
	/**
	 * Copy hasOwnProperty/non-prototype key/values from the map to the obj, returning the same obj.
	 */
	copy : function (obj, map, /*boolean*/ all) {
		if (map === undefined || map === null) return obj;
		all = !!all;
		for (var key in map) if (all || map.hasOwnProperty(key)) obj[key] = map[key];
		return obj;
	},
	/**
	 * Copy all key/values from the map to the obj, returning the same obj.
	 */
	copyAll : function (obj, map) { return this.copy(obj, map, true); },
	/**
	 * Copy hasOwnProperty/non-prototype values from the map to the obj for existing keys in the obj, returning the same obj.
	 */
	copyExisting : function (obj, map, /*boolean*/ all, /*boolean*/ negate) {
		if (map === undefined || map === null) return obj;
		all = !!all; negate = !!negate;
		for (var key in map) if (((key in obj) !== negate) && (all || map.hasOwnProperty(key))) obj[key] = map[key];
		return obj;
	},
	/**
	 * Copy all values from the map to the obj for existing keys in the obj, returning the same obj.
	 */
	copyAllExisting : function (obj, map) { return this.copyExisting(obj, map, true); },
	/**
	 * Copy hasOwnProperty/non-prototype values where the map keys are missing from the obj, returning the same obj.
	 */
	copyMissing : function (obj, map) { return this.copyExisting(obj, map, false, true); },
	/**
	 * Copy all values from the map to the obj where the map keys are missing from the obj, returning the same obj.
	 */
	copyAllMissing : function (obj, map) { return this.copyExisting(obj, map, true, true); },
	/**
	 * Copy the array values to the given obj as map keys all with the given value (obj[ary[i][keyName]] = ary[i][valName]).
	 * If valName is undefined or null then the entire array values it used.
	 */
	copyArrayToObject : function (obj, ary, keyName, valName) {
		if (typeof valName != 'undefined') for (var i=0; i<ary.length; i++) obj[ary[i][keyName]] = ary[i][valName];
		else for (var i=0; i<ary.length; i++) obj[ary[i][keyName]] = ary[i];
		return obj;
	},
	/**
	 * Convert an array-like object into an actual Array, with optional map function to convert values.
	 * This is similar to Array.from() in ES6 but does not support iterables.
	 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
	 */
	copyArray : function (obj, /* optional function(val, key, obj) */ mapFcn, /* optional */ thisArg) {
		var i, len = obj.length || 0, ary = new Array(len);
		if (typeof mapFcn === "function") {
			for (i=0; i<len; i++) ary[i] = mapFcn.call(thisArg, obj[i], i, obj);
		} else {
			for (i=0; i<len; i++) ary[i] = obj[i];
		}
		return ary;
	},
	/**
	 * Append the keys in the map to the given array.
	 */
	concatMapKeys : function(ary, map) {
		for (var key in map) ary[ary.length] = key;
		return ary;
	},
	/**
	 * Get all of the keys in the map as an array.
	 */
	getMapKeys : function(map) {
		return this.concatMapKeys([], map);
	},
	
	/**
	 * Return a nested value from a parent object and a property path string or array, or the given default if not found.
	 * This supports a nested path by Array ["a","b","c"] or dot-delimited String "a.b.c".
	 */
	getProperty : function ( /*object*/ obj, /*Array or String*/ path, def ) {
		if ( typeof path === 'string' || path instanceof String ) { path = path.split('.'); }
		var prop = obj;
		var n = path.length;
		for (var i=0; i<n; i++) {
			if (path[i] in prop) prop = prop[path[i]];
			else return def;
		}
		return prop;
	},
	/**
	 * Set a nested value from a parent object and a property path string or array, creating missing {}/Objects in the path.
	 * This supports a nested path by Array ["a","b","c"] or dot-delimited String "a.b.c".
	 */
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

	/**
	 * Helper to allow instanceof to work for single-inheritance constructor functions.
	 * e.g. akme.SubClass = akme.extend(akme.SuperClass, function() { akme.SuperClass.call(this); ... });
	 * Instead of (akme.SuperClass,...) you can also use (new akme.SuperClass(someParams),...)
	 * and extend will check if it was given a function or object as the first parameter.
	 * If the constructFn is not provided, an empty function(){} constructor will be used, like extending a singleton:
	 *   e.g. akme.core.MessageBroker = akme.extend({...object literal prototype...});
	 * If typeof constructFn is an object, this will assume reversed arguments (constructFn, superPrototype).
	 * If needed, refer to the parent constructor function in the constructFn as this.constructor.constructor.
	 * Javascript functions actually have a constructor property, by default an empty Function.
	 */
	extend : function (superNew, constructFn) {
		if (typeof constructFn === "object") {
			var x = superNew; superNew = constructFn; constructFn = x;
		}
		else if (!constructFn) constructFn = function(){};
		constructFn.prototype = typeof superNew === "function" ? Object.create(superNew.prototype) : superNew;
		constructFn.constructor = constructFn.prototype.constructor;
		constructFn.prototype.constructor = constructFn;
		return constructFn;
	},
	/**
	 * Helper for single-inheritance AND injector/mixin destructor functions.
	 * Use within constructor functions themselves to register their own array of destructors.
	 * Destructor functions are applied in the reverse order added, latest-first.
	 */
	extendDestroy : function (obj, destroyFn) {
		this.extendFunction(obj, "destroy", destroyFn, true);
	},
	/**
	 * Helper for single-inheritance AND injector/mixin functions.
	 * Use within constructor functions themselves to extend functions.
	 * Functions are applied in order added, i.e. earliest first, unless the latestFirst parameter is true.
	 * The latestFirst should be used for destroy methods.
	 */
	extendFunction : function (obj, fcnName, fcn, latestFirst) {
		var old = obj[fcnName];
		if (old) {
			if (latestFirst) obj[fcnName] = function() { fcn.apply(this, arguments); old.apply(this, arguments); };
			else obj[fcnName] = function() { old.apply(this, arguments); fcn.apply(this, arguments); };
		}
		else obj[fcnName] = fcn;
	},
	
	/**
	 * Helper to apply an Array of arguments to a new fn(...) constructor.
	 */
	newApplyArgs : function (fn, args) {
		if (!args || args.length === 0) return new fn();
		switch (args.length) {
		case 1: return new fn(args[0]);
		case 2: return new fn(args[0],args[1]);
		case 3: return new fn(args[0],args[1],args[2]);
		case 4: return new fn(args[0],args[1],args[2],args[3]);
		case 5: return new fn(args[0],args[1],args[2],args[3],args[4]);
		default: 
			var buf = new Array(args.length);
			for (var i=0; i<args.length; i++) buf[i] = "a["+ i +"]";
			return (new Function("f","a","return new f("+ buf.join(",") +");"))(fn,args);
		}
	},

	/**
	 * Helper to invoke a callback function or {handleEvent:function(ev){...}}.
	 */
	handleEvent : function (evHandler) {
		if (!evHandler) return;
		var args = this.slice.call(arguments, 1);
		if (typeof evHandler === "function") evHandler.apply(undefined, args);
		else evHandler.handleEvent.apply(evHandler, args);
	},
	/** 
	 * Fix for IE8 that does not directly support { handleEvent : function (ev) { ... } }.
	 * Ensures internally to be applied only once by setting _ie8fix on the object.
	 */
	fixHandleEvent : function (self) {
		if (document.documentMode && document.documentMode < 9 && typeof self.handleEvent === "function" && !self.handleEvent._ie8fix) {
			var handleEvent = self.handleEvent;
			self.handleEvent = function(ev) { handleEvent.call(self, ev); };
			self.handleEvent._ie8fix = function(){ return handleEvent; }; // closure the old handleEvent
		}
		return self;
	},
	
	trim : function (str) {
		return str.replace(this.WHITESPACE_TRIM_REGEXP, "");
	},
	
	limitLengthWithDots : function (str, len) {
		str = String(str);
		return str.length > len ? str.substring(0,len-3)+"...": str;
	},
		
	padLeft : function (val, size, ch) {
		var s = String(val);
		if (s.length >= size) return s;
		if (s.length+1 == size) return ch+s;
		var a = new Array(1 + (size > s.length ? size-s.length : 0));
		a[a.length-1] = s;
		return a.join(ch ? ch : " ");
	},
	
	round2 : function (number) {
		return Math.round(number*100.0+0.5)/100.0;
	},

	round3 : function (number) {
		return Math.round(number*1000.0+0.5)/1000.0;
	},

	round : function (number, /* double, e.g. 0.01 */ factor) {
		return Math.round(number/factor+0.5)*factor;
	},

	/** Set the given dateTimeLong (no millis) or the defaultDt if not valid. */
	setValidDateTimeInt: function(defaultDt, dateTimeLong) {
		var d = Math.floor(dateTimeLong / 1000000);
		var t = (dateTimeLong % 1000000);
		return this.setValidDateTime(defaultDt, 
				Math.floor(d / 10000), Math.floor(d / 100) % 100, d % 100,
				Math.floor(t / 10000), Math.floor(t / 100) % 100, t % 100);
	},
	
	/** Set the given date and optional time and optional millis or the defaultDt if not valid. */
	setValidDateTime: function(defaultDt, ye, mo, da, ho, mi, se, ms) {
		var dt = new Date(ye, parseInt(mo||1,10)-1, parseInt(da||1,10), parseInt(ho||0,10), parseInt(mi||0,10), parseInt(se||0,10), parseInt(ms||0,10));
		if (dt.getFullYear()!=ye || dt.getMonth()+1!=mo || dt.getDate()!=da) dt = defaultDt;
		else if (arguments.length >= 5 && (dt.getHours()!=ho || dt.getMinutes()!=mi || dt.getSeconds()!=se)) dt = defaultDt;
		else if (arguments.length >= 8 && dt.getMilliseconds()!=ms) dt = defaultDt;
		return dt;
	},
	
	parseDate : function (dateStr) { // Based on example from Paul Sowden.
	    var d = dateStr.match(/([0-9]{4})(-([0-9]{2})(-([0-9]{2})([T ]([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?/);
	    var date = new Date(d[1], parseInt(d[3]||1,10)-1, parseInt(d[5]||1,10), 
	    		parseInt(d[7]||0,10), parseInt(d[8]||0,10), parseInt(d[10]||0,10), d[12] ? Number("0."+d[12])*1000 : 0);
	    //var offset = 0;
	    //if (d[14]) {
	    //    offset = (Number(d[16]) * 60) + Number(d[17]);
	    //    offset *= ((d[15] == '-') ? 1 : -1);
	    //}
	    //offset -= date.getTimezoneOffset();
	    //time = Number(date) + (offset * 60 * 1000);
	    return date;
	},
	
	formatIsoDate : function (date) {
		return date.getFullYear()+'-'+this.padLeft(date.getMonth() + 1, 2, '0')+'-'+this.padLeft(date.getDate(), 2, '0');
	},

	formatIsoDateTime : function (dt, delimiter) {
		if (!delimiter) delimiter = "T";
        var dn = (dt.getFullYear()*10000+(dt.getMonth()+1)*100+dt.getDate()) * 1000000 +
        	dt.getHours()*10000+dt.getMinutes()*100+dt.getSeconds();
        return String(dn).replace(/^(....)(..)(..)(..)(..)(..)/, "$1-$2-$3"+delimiter+"$4:$5:$6."+String(dt.getMilliseconds()+1000).substring(1));
	},
	
    /**
     * Return the rounded (.5 up) number of days between date1 and date2, negative if date2 < date1.
     * This will be affected by daylight saving time forward/back of an hour and leap seconds (e.g. 2012-07-01).
     * Giving pure dates, trimmed of time to midnight, will remove the effects of DST and leap seconds.
     */
    diffDays : function (date1OrMillis, date2OrMillis) {
    	if (date1OrMillis instanceof Date) date1OrMillis = date1OrMillis.getTime();
        if (date2OrMillis instanceof Date) date2OrMillis = date2OrMillis.getTime();
        return Math.floor((date2OrMillis - date1OrMillis + 12*this.MILLIS_IN_HOUR) / this.MILLIS_IN_DAY);
    },
	
	/**
     * Return a 7-digit year*1000+dayOfYear where dayOfYear=1 on the Monday of the week with 4-Jan in it,
     * equivalently the dayOfYear=1 on the Monday of the week with the first Thursday in it (ISO-8601).
     * Use (int)result/1000 to get the year, (int)result%1000 to get the dayOfYear,
     * and (int)(result%1000-1)/7+1 to get the weekOfYear.
     */
	getYearDayByIsoMonday : function(date) {
		var thuOffset = 3 - (date.getDay()+6)%7; // 0=Sun
		var thuDate = new Date(date.getTime());
		thuDate.setDate(thuDate.getDate() + thuOffset); // bridge year by first Thursday
		var isoYear = thuDate.getFullYear();
        var isoWeek0 = Math.round(( thuDate.getTime()-new Date(thuDate.getFullYear(),0,1).getTime() )/this.MILLIS_IN_DAY-1)/7;
		return isoYear*1000 + isoWeek0*7 + 3-thuOffset;
	}, 
	
	/**
	 * Return a Date given a year and day of year based on ISO weeks (ISO-8601) that start the Monday of the week with 4-Jan in it.
	 * JavaScript getDay() gives 0 for Sunday to 6 for Saturday. Java gives 1 for Sunday to 7 for Saturday. Ouch.
	 */
	getDateByIsoMonday : function(year, doy) {
		year = Math.floor(year);
		week = Math.floor(doy);
        var result = new Date(year, 1-1, 4);
        result.setDate(result.getDate() -(result.getDay()+6)%7 + (doy-1));
        return result;
	} 

};


/**
 * akme.core.Access
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	function Access() {
		//$.extendDestroy(this, function(){});
	};
	$.extend($.copyAll( // class-constructor function
		Access, {CLASS: CLASS}
	), { // super-static-prototype object
		clear : null, // any use as related to JPA EntityManager?
		flush : null, // any use as related to JPA EntityManager?
		sync : null, // instead of refresh? sync is better with HTML5 Offline Apps
		syncDecorator : null, // given Array return void
		find : null, // return Array
		findOne : null, // return Object
		findDecorator : null, // given Array return void
		read : null, // return Object
		readDecorator : null, // given Object return void
		readMany : readMany,
		write : null, // given Object return Object
		remove : null // given Object return Object
	});
	$.setProperty($.THIS, CLASS, Access);
	
	//
	// Functions
	//
	
	function readMany(keys) {
		var a = [];
		if (typeof keys === "undefined" || keys === null) return a;
		if (typeof keys === "function") {
			a[a.length] = this.read(keys());
		} else if (keys instanceof Array) for (var i=0; i<keys.length; i++) {
			a[a.length] = this.read(keys[i]);
		} else if (keys instanceof Object) for (var key in keys) {
			a[a.length] = this.read(key);
		} else {
			a[a.length] = this.read(keys);
		}
		return a;
	}
	
})(akme,"akme.core.Access");


/**
 * akme.core.Data
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.

	//
	// Private static declarations / closure
	//
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	// This gives a example of using .prototype directly, not using $.extend.
	function Data() {};
	$.copyAll(Data, {CLASS: CLASS}); // class constructor
	$.copyAll(Data.prototype, { // super-static prototype, public functions
		toString : toString
	});
	$.setProperty($.THIS, CLASS, Data);

	//
	// Functions
	//
	
	function toString() {
		return this.constructor.CLASS+$.formatJSON(this);
	}
	
})(akme,"akme.core.Data");


/**
 * akme.core.IndexedMap
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
  
	//
	// Private static declarations / closure
	//
	var PRIVATES = {};

	//
	// Initialise constructor or singleton instance and public functions
	//
	function IndexedMap() {
		var p = { map : {}, ary : [] }; // private closure
		this.PRIVATES = function(self) { return self === PRIVATES ? p : undefined; };
		this.length = p.ary.length;
	};
	$.extend($.copyAll( // class constructor
		IndexedMap, {CLASS: CLASS} 
	), { // super-static prototype, public functions
    	size : size,
    	linkMapTo : linkMapTo,
    	keys : keys,
    	key : key,
    	keySlice : keySlice,
    	value : value,
    	values : values,
    	valueSlice : valueSlice,
    	get : get,
    	set : set,
    	remove : remove,
    	clear : clear,
		copyFrom : copyFrom,
		copyAllFrom : copyAllFrom
	});
	$.setProperty($.THIS, CLASS, IndexedMap);
	
	//
	// Functions
	//

	// Public functions that use PRIVATES and in turn the privileged this.privates().
	function linkMapTo (obj,key) { obj[key] = this.PRIVATES(PRIVATES).map; return this; };
	function size () { return this.PRIVATES(PRIVATES).ary.length; };
	function keys () { return this.PRIVATES(PRIVATES).ary.slice(0); };
	function key (idx) { return this.PRIVATES(PRIVATES).ary[idx]; };
	function keySlice (start, end) { 
		return end ? this.PRIVATES(PRIVATES).ary.slice(start, end) : this.PRIVATES(PRIVATES).ary.slice(start);
	};
	function value (idx) { var p = this.PRIVATES(PRIVATES); return p.map[p.ary[idx]]; };
	function values () {
		var p = this.PRIVATES(PRIVATES); 
		var r = new Array(p.ary.length);
		for (var i = 0; i < p.ary.length; i++) r[i] = p.map[p.ary[i]];
		return r;
	};
	function valueSlice (start, end) {
		var p = this.PRIVATES(PRIVATES);
		if (!(end >= 0)) end = p.ary.length;
		var r = new Array(end-start);
		for (var i = start; i < end; i++) r[i-start] = p.map[p.ary[i]];
		return r;
	};
	function get (key) { return this.PRIVATES(PRIVATES).map[key]; };
	function set (key, val) {
		var p = this.PRIVATES(PRIVATES); 
		if (!(key in p.map)) {
			p.ary[p.ary.length] = key; this.length = p.ary.length; 
		}
		p.map[key] = val;
	};
	function remove (key) {
		var p = this.PRIVATES(PRIVATES); 
		if (!(key in p.map)) return;
		for (var i=0; i<p.ary.length; i++) if (p.ary[i]===key) {
			p.ary.splice(i, 1); this.length = p.ary.length; break;
        }
		delete p.map[key];
	};
	function clear () {
		var p = this.PRIVATES(PRIVATES); 
		p.ary.splice(0, p.ary.length);
		this.length = 0;
		for (var key in p.map) delete p.map[key];
	};
	
	/**
	 * Copy from the given Array of Objects, or Object of Objects by hasOwnProperty/non-prototype properties.
	 * keyName is required, meaning the property name of the inner object to use as the map key.
	 * valName is optional, meaning to only take a particular property name as the value rather than
	 * the default of taking the entire sub-Object as the value.
	 */
	function copyFrom (aryOrObj, keyName, valName) {
		var hasValName = typeof valName !== 'undefined';
		// redundant? || Array.prototype.isPrototypeOf(aryOrObj)
		if (aryOrObj instanceof Array || typeof aryOrObj.length === "number") {
			for (var i=0; i<aryOrObj.length; i++) {
				this.set(aryOrObj[i][keyName], hasValName ? aryOrObj[i][valName] : aryOrObj[i]);
			}
		} else {
			for (var key in aryOrObj) if (aryOrObj.hasOwnProperty(key)) {
				this.set(aryOrObj[key][keyName], hasValName ? aryOrObj[key][valName] : aryOrObj[key]);
			}
		}
		return this;
	}

	/**
	 * Copy from the given Array/Object including hasOwnProperty and prototype properties.
	 * keyName is required, meaning the property name of the inner object to use as the map key.
	 * valName is optional, meaning to only take a particular property name as the value rather than
	 * the default of taking the entire sub-Object as the value.
	 */
	function copyAllFrom (aryOrObj, keyName, valName) {
		var hasValName = typeof valName !== 'undefined';
		for (var key in aryOrObj) {
			this.set(aryOrObj[key][keyName], hasValName ? aryOrObj[key][valName] : aryOrObj[key]);
		}
		return this;
	}

})(akme,"akme.core.IndexedMap");


/**
 * akme.core.DataTable
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var PRIVATES = {}, // Closure guard for privates.
		KEY_SEP = "\u001f",
		ARRAY = Array.prototype;
	
	function mapKeyPrivate(self,p,row,idx) {
		if (p.key.length === 1) {
			var col = p.key[0];
			if ($.isNumber(col)) self.keyMap[row[col]] = idx;
			else self.keyMap[row[p.map[col]]] = idx;
		} else {
			var key = new Array(p.key.length);
			for (var j=0; j<key.length; j++) key[j] = row[$.isNumber(p.key[j]) ? p.key[j] : p.map[p.key[j]]];
			self.keyMap[key.join(KEY_SEP)] = idx;
		}
	}
	
	function applyArrayMethod(name) {
		return function(){ return ARRAY[name].apply(this.PRIVATES(PRIVATES).body,arguments); };
	}

	//
	// Initialise constructor or singleton instance and public functions
	//
	function DataTable() {
		var p = { idx : -1, key : [], map : {}, head : [], body : [], rowMap : null }; // private closure
		this.PRIVATES = function(self) { return self === PRIVATES ? p : undefined; };
		this.length = p.body.length;
		this.width = p.head.length;
		this.keyMap = {};
	}
	$.extend($.copyAll( // class constructor
		DataTable, {CLASS: CLASS, KEY_SEP: KEY_SEP} 
	), { // super-static prototype, public functions
    	head : head,
    	key : key,
    	meta : meta,
    	clearBody : clearBody,
    	push : push,
    	body : body,
    	bodyObjects : bodyObjects,
    	headIndex : headIndex,
    	rowIndexByKey : rowIndexByKey,
    	rowIndex : rowIndex,
    	rowByKey : rowByKey,
    	row : row,
    	value : value,
    	fromJSON : fromJSON,
    	toJSON : toJSON,
    	join : join, // enhanced from Array.prototype.join
    	select : applyArrayMethod("filter"),
    	mapBy : mapBy
	});
	// Apply read-only non-mutating methods from Array.
	for (var key in {"concat":1,"every":1,"filter":1,"forEach":1,"indexOf":1,"lastIndexOf":1,"map":1,"reduce":1,"reduceRight":1,"slice":1,"some":1}) {
		DataTable.prototype[key] = applyArrayMethod(key);
	}
	// Avoid writing, mutating methods: pop, push, reverse, shift, sort, splice, unshift.
	// Publish the constructor.
	$.setProperty($.THIS, CLASS, DataTable);

	/**
	 * Enhance join to take up to two arguments (rowSeparator,colSeparator) leaving the default as commas for both.
	 * e.g. dt.join("\n","\t") would be TSV, text/tab-separated-values.
	 */
	function join() {
		var p = this.PRIVATES(PRIVATES);
		if (arguments.length > 1) {
			var a = new Array(p.body.length);
			for (var i=0; i<a.length; i++) a[i] = p.body[i].join(arguments[1]);
			return a.join(arguments[0]);
		}
		else return ARRAY.join.apply(p.body,arguments);
	}
	
	function head(aryOrMap /* or arguments */) {
		if (arguments.length > 1) aryOrMap = ARRAY.slice.call(arguments,0);
		var p = this.PRIVATES(PRIVATES);
		p.head.length = 0;
		$.deleteAll(p.map);
		if (aryOrMap instanceof Array) for (var i=0; i<aryOrMap.length; i++) p.map[aryOrMap[i]] = i;
		else $.copy(p.map, aryOrMap);
		this.width = p.head.length;
		
//		function RowMap(row){ this.row = function() { return row; } };
//		p.rowMap = RowMap;
		if (!$.isIE8) p.rowMap = {};
		for (var name in p.map) {
			p.head[p.map[name]] = name;
//			if (!$.isIE8) Object.defineProperty(RowMap.prototype, name, (function(name) { return {
//				get: function() { return this[p.map[name]]; },
//				set: function(v) { this[p.map[name]] = v; }
//			}; } )(name) );
			if (p.rowMap)  p.rowMap[name] = (function(name) { return {
				get: function() { return this[p.map[name]]; },
				set: function(v) { this[p.map[name]] = v; }
			}; } )(name);
		}
	}
	
	function key(intStrAry) {
		var p = this.PRIVATES(PRIVATES);
		if (!(intStrAry instanceof Array)) intStrAry = [intStrAry || 0];
		p.key.length = intStrAry.length;
		for (var i=0; i<p.key.length; i++) p.key[i] = intStrAry[i];
	}
	
	function meta() {
		var p = this.PRIVATES(PRIVATES);
		return {key: p.key.slice(0), head: p.head.slice(0), headLength: p.head.length, bodyLength: p.body.length};
	}
	
	function clearBody() {
		var p = this.PRIVATES(PRIVATES);
		this.length = p.body.length = 0;
		$.deleteAll(this.keyMap);
	}
	
	function push(row) {
		this.body([row]);
	}
	
	function body(ary,hdr) {
		var p = this.PRIVATES(PRIVATES);
		for (var i=0; i<ary.length; i++) {
			var row = ary[i];
			if (hdr) { hdr=false; this.head(row); continue; }
			//row.map = (function(rowMap){ return function() { return rowMap; }; })(new p.rowMap(row));
			if (p.rowMap) Object.defineProperties(row, p.rowMap);
			p.body.push(row);
			mapKeyPrivate(this,p,row,p.body.length-1);
		}
		this.length = p.body.length;
	}
	
	function bodyObjects(aryObj) {
		var p = this.PRIVATES(PRIVATES);
		for (var i=0, j=0; i<aryObj.length; i++) {
			var obj = aryObj[i];
			if (p.head.length === 0) {
				var map = {};
				for (var key in obj) map[key] = j++;
				this.head(map);
			}
			var row = new Array(p.head.length);
			if (p.rowMap) Object.defineProperties(row, p.rowMap);
			for (j=0; j<row.length; j++) row[j] = obj[p.head[j]];
			p.body.push(row);
			mapKeyPrivate(this,p,row,p.body.length-1);
		}
		this.length = p.body.length;
	}
	
	function headIndex(name) {
		var idx = this.PRIVATES(PRIVATES).map[name];
		return idx >= 0 ? idx : -1;
	}
	
	/**
	 * Get or set the internal row index, setting if an idx is given.  
	 */
	function rowIndex(idx) {
		var p = this.PRIVATES(PRIVATES);
		if (!(idx >= 0)) return this.PRIVATES(PRIVATES).idx; 
		if ($.isNumber(idx) && idx >= 0 || idx < p.body.length) p.idx = idx;
		else p.idx = -1;
	}
	
	function rowIndexByKey(key) {
		var idx = this.keyMap[arguments.length > 1 ? ARRAY.slice.call(arguments,0).join(KEY_SEP) : 
				(key instanceof Array ? key.join(KEY_SEP) : key)];
		return idx >= 0 ? idx : -1;
	}
	
	function rowByKey() {
		return this.row(this.rowIndexByKey.apply(this,arguments));
	}
	
	/**
	 * Get the row at the given index or the current index. 
	 */
	function row(idx) {
		var p = this.PRIVATES(PRIVATES);
		return p.body[typeof idx !== "undefined" ? idx : p.idx];
	}
	
	function value(idxOrName/* or row,idxOrName*/) {
		var p = this.PRIVATES(PRIVATES);
		var row = arguments[0], idxOrName = arguments[1];
		if (arguments.length === 1) { idxOrName = row; row = p.idx; }
		return p.body[row][typeof idxOrName === "number" ? idxOrName : this.headIndex(name)];
	}
	
	/**
	 * Return a map/object with keys returned by the given keyFn,
	 * the values in the map being the arrays of rows with the same key.
	 * e.g. 
	 * 	dt.byCity = dt.mapBy(function keyFn(row){ return row["city"]; });
	 *  for (var name in dt.byCity) dt.byCity[name].forEach(function(row){ console.log(name,row); }); 
	 */
	function mapBy(keyFn /*, thisArg */) {
		var map = {}, thisArg = arguments.length >= 2 ? arguments[1] : undefined;
		this.forEach(function(row,idx){
			var key = keyFn.call(thisArg,row,idx,this), ary;
			if (key != null) {
				ary = map[key] || [];
				ary[ary.length] = row;
				if (ary.length === 1) map[key] = ary;
			}
		});
		return map;
	}
	
	function fromJSON(json) {
		var obj = $.isString(json) ? $.parseJSON(json) : json;
		this.head(obj.head);
		this.key(obj.key);
		this.clearBody();
		this.body(obj.body);
	}
	
	function toJSON() {
		// return $.formatJSON(this); avoid circular reference
		var p = this.PRIVATES(PRIVATES);
		return $.formatJSON({key: p.key, head: p.head, body: p.body});
	}
	
})(akme,"akme.core.DataTable");


/**
 * akme.core.EventSource
 * Provide simple event handling NOT related to DOM Events.
 * This is intended to be used via akme.core.EventSource.apply(this) to construct/inject functionality 
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
		if (this.EVENTS) return; // only apply once
		if (console.logEnabled) console.log(this.constructor.CLASS+" injecting "+CLASS+" arguments.length "+ arguments.length);
		var p = {eventMap:{}}; // private closure
		// Use a different aspect name to avoid conflict with this.PRIVATES.
		this.EVENTS = function(self) { return self === PRIVATES ? p : undefined; };
		this.onEvent = onEvent;
		this.unEvent = unEvent;
		this.doEvent = doEvent;

		$.extendDestroy(this, destroy);
	};
	// Example of extend with the Object super-class constructor-function first, then the sub-class constructor.
	$.extend(Object, $.copyAll(EventSource, {CLASS: CLASS}));
	$.setProperty($.THIS, CLASS, EventSource);
	
	//
	// Functions
	//

	function destroy() {
		if (console.logEnabled) console.log(this.constructor.CLASS+".destroy() "+CLASS);
		var p = this.EVENTS(PRIVATES);
		for (var key in p.eventMap) delete p.eventMap[key];
	}
	
	/**
	 * Append the given function to the event handlers for the named event.
	 * The fnOrHandleEventObject can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function onEvent(type, fnOrHandleEventOb, once) {
		if (!(typeof fnOrHandleEventOb === "function" || typeof fnOrHandleEventOb.handleEvent === "function")) {
			throw new TypeError(this.constructor.CLASS+".onEvent given neither function(ev){...} nor { handleEvent:function(ev){...} }");
		}
		var p = this.EVENTS(PRIVATES), a = p.eventMap[type];
		if (!a) { a = []; p.eventMap[type] = a; }
		var handler = $.fixHandleEvent(fnOrHandleEventOb);
		a.push({handler:handler, once:!!once});
	}
	
	/**
	 * Remove the given function from the event handlers for the named event.
	 * The fnOrHandleEventObject can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function unEvent(type, fnOrHandleEventOb) {
		var p = this.EVENTS(PRIVATES);
		var a = p.eventMap[type];
		if (!a) return;
		for (var i=0; i<a.length; i++) if (a[i].handler === fnOrHandleEventOb) { a.splice(i,1); }
	}

	/**
	 * Fire the actual event, looping through and calling handlers/listeners registered with onEvent.
	 */
	function doEvent(ev) {
		var p = this.EVENTS(PRIVATES);
		var a = p.eventMap[ev.type];
		if (a) for (var i=0; i<a.length; i++) {
			var eh = a[i];
			if (typeof eh.handler === "function") eh.handler.call(undefined, ev);
			else eh.handler.handleEvent.call(eh.handler, ev);
			if (eh.once) a.splice(i--,1);
		}
	}

})(akme,"akme.core.EventSource");


/* OLD akme.core.Promise code
	function concatFunctionsAndReturn(p, state, self, fcns) {
		if (p.state === 0) $.concat(p[STATE_ARY[state]], fcns);
		else if (p.state === state) applyToArray(fcns, p.self, p.args);
		return self;
	};
	
	Make a promise calling the given function before progress starts.
	function make(startFn) {
		return new Promise(startFn);
	}
	
	 * Return a Promise based on given object(s) which may in turn be Promise(s).
	 * This will wait on them all and fail on first reject, notify about all of them,
	 * and only resolve when all are resolved/done with all of the ([object,...], [arguments,...]) resolved.
	 * If only one sub is given and it's not a promise it will resolve/done with (undefined, sub).
	 * If only sub sub is given and it is a promise then it will progress/fail/done as normal.
	
	function when(sub) {  //, sub2, ...
		var args = $.concat([], arguments);
		var item, i, len = args.length;
		var todo = len !== 1 || (sub && typeof sub.promise === "function") ? len : 0;
		var promise = todo === 1 ? sub : new Promise();
		var selfs, progressArgs, progressSelfs; 
		if (len > 1) {
			selfs = new Array( len );
			progressArgs = new Array( len );
			progressSelfs = new Array( len );
			for (i=0; i<len; i++) {
				item = args[i];
				if (item && typeof item.promise === "function") {
					item.promise().done( update(i, selfs, args) )
						.fail( promise.reject.bind(promise) )
						.progress( update(i, progressSelfs, progressArgs) );
				} else {
					--todo;
				}
			}
		}
		function update(i, selfs, args) {
			return function( value ) {
				selfs[i] = this;
				args[i] = arguments.length > 1 ? SLICE.call( arguments ) : value;
				if( args === progressArgs ) {
					promise.notifyWith( selfs, args );
				} else if (!( --todo )) {
					promise.resolveWith( selfs, args );
				}
			};
		}
		if ( !todo ) {
			promise.resolveWith( selfs, args );
		}
		return promise.promise();
	}
	
*/
/**
 * akme.core.Promise
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	$.setProperty($.THIS,CLASS,Promise);
	
	//
	// Private static declarations / closure
	//
	var PRIVATES = {},  // Closure guard for privates.
		Util = akme;
		//STATE_NAMES = ["pending", "fulfilled", "rejected"];  // fulfilled aka resolved

	//
	// Initialise constructor or singleton instance and public functions
	//
    function Promise(/*function(fulfillFcn,rejectFcn)*/ executor) {
        if (!(this instanceof Promise)) {
            return new Promise(executor);
        }
        // private closure and guard function
        // callbackAry follows the state:{ 0:"pending", 1:"fulfilled", 2:"rejected" }.
        var p = { state: 0, self: this, args: null, callbackAry: [[],[],[]] };
        this.PRIVATES = function(self) { return self === PRIVATES ? p : undefined; };

        // Callback the executor to pass the resolve and reject methods with the creator/producer of the Promise.
        try {
            executor.call(p.self, fulfillFcn, rejectFcn);
        } catch (er) {
            reject(er);
        }

        function fulfillFcn() {
            switch (p.state) {
            case 0: p.state = 1; p.args = arguments;  // fallthrough
            case 1: APPLY_ARRAY(p.callbackAry[p.state], p.self, p.args, true); break;
            case 2: console.warn(String( new RangeError("cannot resolve after reject") ));
            }
        };
        function rejectFcn() {
            switch (p.state) {
            case 0: p.state = 2; p.args = arguments;  // fallthrough
            case 2: APPLY_ARRAY(p.callbackAry[p.state], p.self, p.args, true); break;
            case 1: console.warn(String( new RangeError("cannot reject after resolve") ));
            }
        };
    };
    Util.copyAll(Promise, {  // static-constructor function properties
        CLASS: CLASS,
        fulfill: fulfill,
        resolve: fulfill,
        reject: reject
    }).prototype = {  // super-prototype object properties
        then : then,
        "catch": function (onRejected) {
            return this.then(undefined, onRejected);
        }
    };
	
	//
	// Functions
	//
	
    // Apply/call an array of functions with a given this/self and arguments.
    // If once is true then the array of functions is cleared after being used.
    function APPLY_ARRAY(ary, self, args, once) {  // IE8 cannot apply null or undefined args.
        for (var i=0; i<ary.length; i++) args ? ary[i].apply(self, args) : ary[i].call(self);
        if (!!once) ary.length = 0;
    };

    function fulfill() {  // fulfill aka resolve
        var args = arguments;
        return new Promise(function(fulfillFcn,rejectFcn) {
            fulfillFcn.apply(this,args);
        });
    };

    function reject() {
        var args = arguments;
        return new Promise(function(fulfillFcn,rejectFcn) {
            rejectFcn.apply(this,args);
        });
    };

    function then(/*function onFulfilled, function onRejected*/) {  // onPending is non-standard, not implemented
        // Append fulfillment and rejection handlers to the promise,
        // and return a new promise resolving to the return value of the called handler.
        // TODO: what happens if an onFulfilled/onRejected callback returns a new promise/thenable?
        var p = this.PRIVATES(PRIVATES), callbackArgs = arguments;
        var result = new Promise(function executor(/*function fulfill, function reject*/) {
            var newPromise = this, executorArgs = arguments;
            for (var i=0; i<2; i++) (function (i) {
                // If a callback is a function, wrap it in a function to be called later with our closures.
                var f = callbackArgs[i];
                if (typeof f === "function") callbackArgs[i] = function() {
                    try {
                        var r = f.apply(p.self, arguments);
                        if (typeof r !== "undefined" && typeof r.then === "function") {
                            r.then.apply(newPromise, executorArgs);
                        } else {
                            executorArgs[i].apply(newPromise, typeof r !== "undefined" ? [r] : arguments);
                        }
                    } catch (er) { // reject on callback error
                        if (executorArgs[1]) executorArgs[1](er);
                    }
                };
            })(i);
        });
        // Now that a new Promise is prepared and callbackArgs adjusted if necessary,
        // add to the future callback arrays if the state is 0:pending otherwise call immediately.
        if (p.state === 0) for (var i=0, n=Math.min(callbackArgs.length, p.callbackAry.length); i<n; i++) {
            if (callbackArgs[i]) p.callbackAry[i==2 ? 0 : i+1].push(callbackArgs[i]);
        } else {
            var callback = callbackArgs[p.state==0 ? 2 : p.state-1];
            if (callback) callback.apply(p.self, p.args);
        }
        return result;
    };

})(akme,"akme.core.Promise");
