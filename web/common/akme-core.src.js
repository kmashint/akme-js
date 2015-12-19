// akme-core.js
// Javascript Types: undefined, null, boolean, number, string, function, or object; Date and Array are typeof object.
// typeof works for a function or object but note typeof String(1) is string yet typeof new String(1) is object.
// instanceof uses inheritance but will not work between windows/js-security-contexts due to different underlying prototypes.
// This limitation of instanceof is another reason to use postMessage between frames.

// Simple ability to ensure console.log and allow for use of if (console.logEnabled).
// http://www.tuttoaster.com/learning-javascript-and-dom-with-console/
// http://www.thecssninja.com/javascript/console

/*jshint browser:true */
/*globals akme */

// Add safe (from side-effects) compatibility to built-in JS constructor functions like Object, Function, Array.
(function(global){
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

        var slice = Array.prototype.slice,
            args = slice.call(arguments, 1),
            self = this,
            NOOP = function () {},
            bound = function () {
            return self.apply(this instanceof NOOP ? this : oThis || window,
                                 args.concat(slice.call(arguments)));
            };

        NOOP.prototype = this.prototype;
        bound.prototype = new NOOP();

        return bound;
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
     * Object.forEach() that defers to an instance level implementation or Array.forEach() where available.
     * This calls the given fcn for each index of an Array, or each hasOwnProperty of an Object.
     * This does not handle arguments so those to an Array first.
	 */
	if (!Object.forEach) Object.forEach = function(obj, /* function(val, key, obj) */ fcn, thisArg) {
		var key;
        if (typeof obj.forEach === "function") {
			obj.forEach(fcn, thisArg);
		}
		else if (obj instanceof Array || (typeof NodeList !== "undefined" && obj instanceof NodeList)
				) for (key=0; key<obj.length; key++) {
			fcn.call(thisArg || obj, obj[key], key, obj);
		}
		else for (key in obj) if (obj.hasOwnProperty(key)) {
			fcn.call(thisArg || obj, obj[key], key, obj);
		}
	};

	/**
     * Convert an array-like object into an actual Array, with optional map function to convert values.
     * This is similar to Array.from() in ES6 but does not support iterables.
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
	 */
	if (!Array.from) Array.from = function (obj, /* optional function(val, key, obj) */ mapFcn, /* optional */ thisArg) {
		var i, len = obj.length || 0, ary = new Array(len);
		if (typeof mapFcn === "function") {
			for (i=0; i<len; i++) ary[i] = mapFcn.call(thisArg, obj[i], i, obj);
		} else {
			for (i=0; i<len; i++) ary[i] = obj[i];
		}
		return ary;
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
		copyToArray(key);
	}
    function copyToArray(key) {
        if (!Array[key]) Array[key] = function(ary) { return ARRAY[key].apply(ary, SLICE.call(arguments,1)); }; 
    }

})(this);


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
	 * Or just use x != null that equates undefined to null.
     * If x may be undeclared you need to check if (x === undefined).
	 */
	isDefinedNotNull : function(x) { return x != null; },  //jshint ignore:line
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
	 * Check if the object is typeof object.
	 */
	isObject : function(x) { return typeof x === "object"; },
	/**
	 * Check if the object is typeof string (primitive) or instanceof String (object).
	 */
	isString : function(x) { return typeof x === "string" || x instanceof String; },
	/** 
	 * Check if the object is empty, e.g. undefined, null, boolean false, number 0,
	 * empty string "", empty array [], empty object {}.  It can't tell an empty function.
	 */
	isEmpty : function(x) {
		if (!x) {
			// Handle undefined, null, boolean false, number 0, and empty string implicitly.
			return true;
		}
		if (this.isArray(x)) {
			return x.length === 0;
		}
		var k;
		if (this.isObject(x)) {
			for (k in x) {
				return false;
			}
			return true;
		}
		return false;
	},
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
	 * Shallow or deep (unchecked) clone, returning a new/cloned obj.
     * Uses appropriate handling for undefined, null, primitives, arrays, and simple {...} objects.
     * In general it will call obj.constructor(obj) for non trivial objects, e.g. Date, RegExp, or MyObject.
     * Warning: functions are referenced, not cloned!
	 * Warning: deepUnchecked does NOT check for cyclical references!
	 */
	clone : function (obj, deepUnchecked) {
		if (obj == null || !this.isObject(obj) || this.isFunction(obj)) return obj;  //jshint ignore:line
        if (obj.constructor !== Object && !this.isArray(obj)) return new obj.constructor(obj);
		var clone = this.isArray(obj) ? new Array(obj.length) : Object.create(Object.getPrototypeOf(obj));
		for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = deepUnchecked ? this.clone(obj[key], deepUnchecked) : obj[key];
            }
        }
		return clone;
	},
	/**
	 * Copy hasOwnProperty/non-prototype key/values from the map to the obj, returning the same obj.
	 */
	copy : function (obj, map, /*boolean*/ all) {
		if (map == null) return obj;  //jshint ignore:line
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
		if (map == null) return obj;  //jshint ignore:line
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
        var i;
		if (valName !== undefined) for (i=0; i<ary.length; i++) obj[ary[i][keyName]] = ary[i][valName];
		else for (i=0; i<ary.length; i++) obj[ary[i][keyName]] = ary[i];
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
	 * Get all of the keys in the map as an array, 
     * similar to Object.keys() but without the hasOwnProperty check.
	 */
	getMapKeys : function(map) {
		return this.concatMapKeys([], map);
	},
	/**
	 * Similar to Array.prototype.some but handles objects without the overhead of Object.keys().some().
	 * Easier to use than Array.prototype.every since the callback only needs to return something to stop.
	 */
	some : function (obj, callback, /* optional */ thisArg) {
		if (obj == null) return false;  //jshint ignore:line
		if (this.isArray(obj)) return obj.some(callback, thisArg);
		if (thisArg === undefined) thisArg = obj;
		for (var key in obj) {
			if (!obj.hasOwnProperty(key)) continue;
			if (callback.call(thisArg, obj[key], key, obj)) return true;
		}
		return false;
	},
	
	/**
	 * Return a nested value from a parent object and a property path string or array, or the given default if not found.
	 * This supports a nested path by Array ["a","b","c"] or dot-delimited String "a.b.c".
	 */
	getProperty : function ( /*object*/ obj, /*Array or String*/ path, def ) {
		if (this.isString(path)) { path = path.split('.'); }
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
	setProperty : function ( /*object*/ obj, /*Array or String*/ path, val, onlyIfUnset ) {
		if (this.isString(path)) { path = path.split('.'); }
		var prop = obj;
		var n = path.length-1;
		for (var i=0; i<n; i++) {
			if (path[i] in prop) prop = prop[path[i]];
			else prop = prop[path[i]] = {};
		}
		var old = prop[path[n]];
		if (!onlyIfUnset || (onlyIfUnset && old === undefined)) prop[path[n]] = val;
		return old;
	},

	/**
	 * Extends a given contructFcn() to be an instanceof superClass.
	 * The superClass may be a function or an object, the latter if it is intended to be the constructFcn.prototype.
	 * This also creates a relationship such that this.constructor.constructor is the superClass constructor.
	 * So given  var car = new akme.extendClass(Car, Vehicle);  then  car.constructor.constructor === Vehicle  .
	 */
	extendClass : function (ctorFcn, superClass) {
		if (superClass) {
			if (typeof superClass === "function") ctorFcn.prototype = Object.create(superClass.prototype);
			else ctorFcn.prototype = superClass;
		}
		ctorFcn.constructor = ctorFcn.prototype.constructor;
		ctorFcn.prototype.constructor = ctorFcn;
		return ctorFcn;
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
	 * Helper to apply an Array of arguments to a new fcn(...) constructor.
	 */
	newApplyArgs : function (fcn, args) {
		if (!args || args.length === 0) return new fcn();
		switch (args.length) {
		case 1: return new fcn(args[0]);
		case 2: return new fcn(args[0],args[1]);
		case 3: return new fcn(args[0],args[1],args[2]);
		case 4: return new fcn(args[0],args[1],args[2],args[3]);
		case 5: return new fcn(args[0],args[1],args[2],args[3],args[4]);
		default:
			var buf = new Array(args.length);
			for (var i=0; i<args.length; i++) buf[i] = "a["+ i +"]";
			return (new Function("f","a","return new f("+ buf.join(",") +");"))(fn,args);  //jshint ignore:line
		}
	},

	/**
	 * Helper to invoke the given callback function or {handleEvent:function(ev){...}} object.
	 */
	handleEvent : function (evHandler) {
		if (!evHandler) return;
		var args = this.slice.call(arguments, 1);
		if (typeof evHandler === "function") evHandler.apply(undefined, args);
		else evHandler.handleEvent.apply(evHandler, args);
	},
    
    /** 
	 * Fix for IE8 that does not directly support { handleEvent : function (ev) { ... } }.
	 * Ensures internally to be applied only once by setting _original on the object which holds the original handleEvent object.
	 */
	fixHandleEvent : function (self) {
		if (this.isIE8 && typeof self.handleEvent === "function" && !self.handleEvent._original) {
			var handleEvent = self.handleEvent;
			self.handleEvent = function() { handleEvent.apply(self, arguments); };
			self.handleEvent._original = function() { return handleEvent; };
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
		doy = Math.floor(doy);
        var result = new Date(year, 1-1, 4);
        result.setDate(result.getDate() -(result.getDay()+6)%7 + (doy-1));
        return result;
	}

};


/**
 * akme.core.Access
 */
(function($,CLASS){
	if ($.setProperty($.THIS,CLASS,Access,true)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	function Access() {
		//$.extendDestroy(this, function(){});
	}
	$.extendClass($.copyAll( // class-constructor function
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
	
	//
	// Functions
	//
	
	function readMany(keys) {
		var a = [];
		if (keys == null) return a;  //jshint ignore:line
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
	if ($.setProperty($.THIS,CLASS,Data,true)) return; // One-time.

	//
	// Private static declarations / closure
	//
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	// This gives a example of using .prototype directly, not using $.extend.
	function Data() {}
	$.copyAll(Data, {CLASS: CLASS}); // class constructor
	$.copyAll(Data.prototype, { // super-static prototype, public functions
		toString : toString
	});

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
	if ($.setProperty($.THIS,CLASS,IndexedMap,true)) return; // One-time.
  
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
	}
	$.extendClass($.copyAll( // class constructor
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
	
	//
	// Functions
	//

	// Public functions that use PRIVATES and in turn the privileged this.privates().
	function linkMapTo (obj,key) { obj[key] = this.PRIVATES(PRIVATES).map; return this; }
	function size () { return this.PRIVATES(PRIVATES).ary.length; }
	function keys () { return this.PRIVATES(PRIVATES).ary.slice(0); }
	function key (idx) { return this.PRIVATES(PRIVATES).ary[idx]; }
	function keySlice (start, end) { 
		return end ? this.PRIVATES(PRIVATES).ary.slice(start, end) : this.PRIVATES(PRIVATES).ary.slice(start);
	}
	function value (idx) { var p = this.PRIVATES(PRIVATES); return p.map[p.ary[idx]]; }
	function values () {
		var p = this.PRIVATES(PRIVATES); 
		var r = new Array(p.ary.length);
		for (var i = 0; i < p.ary.length; i++) r[i] = p.map[p.ary[i]];
		return r;
	}
	function valueSlice (start, end) {
		var p = this.PRIVATES(PRIVATES);
		if (!(end >= 0)) end = p.ary.length;  //jshint ignore:line
		var r = new Array(end-start);
		for (var i = start; i < end; i++) r[i-start] = p.map[p.ary[i]];
		return r;
	}
	function get (key) { return this.PRIVATES(PRIVATES).map[key]; }
	function set (key, val) {
		var p = this.PRIVATES(PRIVATES); 
		if (!(key in p.map)) {
			p.ary[p.ary.length] = key; this.length = p.ary.length; 
		}
		p.map[key] = val;
	}
	function remove (key) {
		var p = this.PRIVATES(PRIVATES); 
		if (!(key in p.map)) return;
		for (var i=0; i<p.ary.length; i++) if (p.ary[i]===key) {
			p.ary.splice(i, 1); this.length = p.ary.length; break;
        }
		delete p.map[key];
	}
	function clear () {
		var p = this.PRIVATES(PRIVATES); 
		p.ary.splice(0, p.ary.length);
		this.length = 0;
		for (var key in p.map) delete p.map[key];
	}
	
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
		for (var key in aryOrObj) {
			this.set(aryOrObj[key][keyName], valName !== undefined ? aryOrObj[key][valName] : aryOrObj[key]);
		}
		return this;
	}

})(akme,"akme.core.IndexedMap");


/**
 * akme.core.DataTable
 */
(function($,CLASS){
	if ($.setProperty($.THIS,CLASS,DataTable,true)) return; // One-time.
	
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
	$.extendClass($.copyAll( // class constructor
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
	for (var k in {"concat":1,"every":1,"filter":1,"forEach":1,"indexOf":1,"lastIndexOf":1,"map":1,"reduce":1,"reduceRight":1,"slice":1,"some":1}) {
		DataTable.prototype[k] = applyArrayMethod(k);
	}
	// Avoid writing, mutating methods: pop, push, reverse, shift, sort, splice, unshift.

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
			if (p.rowMap) p.rowMap[name] = getAccessor(name);
		}
        function getAccessor(name) { return {
            get: function() { return this[p.map[name]]; },
			set: function(v) { this[p.map[name]] = v; }
        }; }
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
		if (!(idx >= 0)) return this.PRIVATES(PRIVATES).idx;  //jshint ignore:line
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
		return p.body[idx !== undefined ? idx : p.idx];
	}
	
	function value(/*idxOrName or row,idxOrName*/) {
		var p = this.PRIVATES(PRIVATES);
		var row = arguments[0], idxOrName = arguments[1];
		if (arguments.length === 1) { idxOrName = row; row = p.idx; }
		return p.body[row][typeof idxOrName === "number" ? idxOrName : this.headIndex(name)];
	}
	
	/**
	 * Return a map/object with keys returned by the given keyFcn,
	 * the values in the map being the arrays of rows with the same key.
	 * e.g. 
	 * 	dt.byCity = dt.mapBy(function keyFcn(row){ return row["city"]; });
	 *  for (var name in dt.byCity) dt.byCity[name].forEach(function(row){ console.log(name,row); }); 
	 */
	function mapBy(keyFcn /*, thisArg */) {
		var map = {}, thisArg = arguments.length >= 2 ? arguments[1] : undefined;
		this.forEach(function(row,idx){
			var key = keyFcn.call(thisArg,row,idx,this), ary;
			if (key != null) {  //jshint ignore:line
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
	if ($.setProperty($.THIS,CLASS,EventSource,true)) return; // One-time.

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
	}
	// Example of extend with the Object super-class constructor-function first, then the sub-class constructor.
	$.extendClass($.copyAll(EventSource, {CLASS: CLASS}), Object);
	
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
	 * The fcnOrHandleEventObj can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function onEvent(type, fcnOrHandleEventObj, once) {
		if (!(typeof fcnOrHandleEventObj === "function" || typeof fcnOrHandleEventObj.handleEvent === "function")) {
			throw new TypeError(this.constructor.CLASS+".onEvent given neither function(ev){...} nor { handleEvent:function(ev){...} }");
		}
		var p = this.EVENTS(PRIVATES), a = p.eventMap[type];
		if (!a) { a = []; p.eventMap[type] = a; }
		var handler = $.fixHandleEvent(fcnOrHandleEventObj);
		a.push({handler:handler, once:!!once});
	}
	
	/**
	 * Remove the given function from the event handlers for the named event.
	 * The fcnOrHandleEventObj can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function unEvent(type, fcnOrHandleEventObj) {
		var p = this.EVENTS(PRIVATES);
		var a = p.eventMap[type];
		if (!a) return;
		for (var i=0; i<a.length; i++) if (a[i].handler === fcnOrHandleEventObj) { a.splice(i,1); }
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
 * EcmaScript 6 compatible Promise.
 * This will extend an existing ES6 Promise if available.
 * It follows the ES6 Promise nature of calling then()ables in the next JS event loop.
 * Since the executor function really should act as an extension of the constructor,
 * it sets the promise object as "this" within the executor, e.g. the line below should log true.
 *   new Promise(function executor(fulfill,reject){ console.log(this instanceof Promise); });
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 * http://www.html5rocks.com/en/tutorials/es6/promises/
 * http://bugs.jquery.com/ticket/14510 - jQuery in 1.12+, 2.2+ better supports ES6 then-able
 */
(function($,CLASS){
    // If the standard ES6 promise is available, extend it support  self = this  in the constructor.
    // http://stackoverflow.com/questions/31069453/creating-a-es6-promise-without-starting-to-resolve-it
    if ($.THIS.Promise && !$.getProperty($.THIS,CLASS)) {
        $.setProperty($.THIS,CLASS,ExtendPromise);
		
        $.copyAll(ExtendPromise, {  // static-constructor function properties
            CLASS: CLASS,
            constructor: $.THIS.Promise,  // this.constructor.constructor.apply(this) like this.super.apply(this)
            fulfill: $.THIS.Promise.resolve,
            resolve: $.THIS.Promise.resolve,
            reject: $.THIS.Promise.reject
        }).prototype = $.copyAll(Object.create($.THIS.Promise.prototype), {  // prototype inheritance
			constructor: ExtendPromise
		});
    }
    function ExtendPromise(executor) {
        var execArgs,
            promise = new $.THIS.Promise(function() { execArgs = arguments; });
        try {
            executor.apply(promise, execArgs);
        }
        catch (err) {
            execArgs[1](err);
        }
        return promise;
    }
	if ($.setProperty($.THIS,CLASS,Promise,true)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var PRIVATES = {};  // Closure guard for privates.
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
            switch (p.state) {  // case 0 has intended fallthrough
            case 0: p.state = 1; p.args = arguments;  //jshint ignore:line
            case 1: applyArrayAsync(p.callbackAry[p.state], p.self, p.args, true); break;
            case 2: console.warn(String( new RangeError("cannot resolve after reject") ));
            }
        }
        function rejectFcn() {
            switch (p.state) {  // case 0 has intended fallthrough
            case 0: p.state = 2; p.args = arguments;  //jshint ignore:line
            case 2: applyArrayAsync(p.callbackAry[p.state], p.self, p.args, true); break;
            case 1: console.warn(String( new RangeError("cannot reject after resolve") ));
            }
        }
    }
    $.copyAll(Promise, {  // static-constructor function properties
        CLASS: CLASS,
        fulfill: resolve,
        resolve: resolve,
        reject: reject
    }).prototype = {  // super-prototype object properties
        then: then,
        "catch": function (onRejected) {
            return this.then(undefined, onRejected);
        },
        always: function (onAny) {
            return this.then(onAny, onAny);
        }
    };
	
	//
	// Functions
	//
	
    // Apply/call an array of functions in the next JS event loop with a given this/self and arguments.
    // If once is true then the array of functions is cleared after being used.
    function applyArrayAsync(ary, self, args, once) {  // IE8 cannot apply null or undefined args.
		setTimeout(function() {
			for (var i=0; i<ary.length; i++) if (args) ary[i].apply(self, args); else ary[i].call(self);
			if (!!once) ary.length = 0;
		}, 0);
    }

    function resolve() {  // fulfill aka resolve
        var args = arguments;
        return new Promise(function(fulfillFcn,rejectFcn) {
            fulfillFcn.apply(this,args);
        });
    }

    function reject() {
        var args = arguments;
        return new Promise(function(fulfillFcn,rejectFcn) {
            rejectFcn.apply(this,args);
        });
    }

    function then(/*function onFulfilled, function onRejected*/) {  // onPending is non-standard, not implemented
        // Append fulfillment and rejection handlers to the promise,
        // and return a new promise resolving to the return value of the called handler.
        var p = this.PRIVATES(PRIVATES), callbackArgs = arguments;
        var result = new Promise(function executor(/*function fulfill, function reject*/) {
            var newPromise = this, executorArgs = arguments;
            for (var i=0; i<2; i++) pass0fail1(i);
            function pass0fail1(i) {
                // If a callback is a function, wrap it in a function to be called later with our closures.
                var f = callbackArgs[i];
                if (typeof f === "function") callbackArgs[i] = function() {
                    try {
                        var r = f.apply(p.self, arguments);
                        if (r != null && typeof r.then === "function") {  //jshint ignore:line
                            r.then.apply(r, executorArgs);
                        } else {
                            executorArgs[i].apply(newPromise, r !== undefined ? [r] : arguments);
                        }
                    } catch (er) {  // reject on callback error
                        if (executorArgs[1]) executorArgs[1](er);
                    }
                };
            }
        });
        // Now that a new Promise is prepared and callbackArgs adjusted if necessary,
        // add to the future callback arrays if the state is 0:pending otherwise call in the next JS event loop.
        if (p.state === 0) for (var i=0, n=Math.min(callbackArgs.length, p.callbackAry.length); i<n; i++) {
            if (callbackArgs[i]) p.callbackAry[i===2 ? 0 : i+1].push(callbackArgs[i]);
        } else {
            var callback = callbackArgs[p.state===0 ? 2 : p.state-1];
            if (callback) setTimeout(function(){ callback.apply(p.self, p.args); }, 0);
        }
        return result;
    }

})(akme,"akme.core.Promise");
// akme.getContext
// See Spring AbstractApplicationContext for related basics.
// See refreshSpring.jsp for refreshing a single bean.
//
(function($,CLASS) {
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	$.setProperty($.THIS, CLASS, Context);
	
	//
	// Private static declarations / closure
	//
	var PRIVATES = {}, // Closure scope guard for this.PRIVATES.
		//LOCK = [true], // var lock = LOCK.pop(); if (lock) try { ... } finally { if (lock) LOCK.push(lock); }
		CONTEXT, // ROOT
		PUBLIC_GETTER = "akme.getContext"; 

	//
	// Initialise instance and public functions
	//
	function Context(refreshFnOrHandleEventOb) {
		var p = { parent: $.getContext ? $.getContext() : null, map: {}, count: 0, refreshDate: null };
		this.PRIVATES = function(self){ return self === PRIVATES ? p : undefined; };
		
		$.core.EventSource.apply(this); // Apply/inject/mixin event handling.
		var self = this;
		this.onEvent("refresh", function(ev) {
			p.refreshDate = new Date();
			if (refreshFnOrHandleEventOb) $.handleEvent(refreshFnOrHandleEventOb, ev);
			$.setProperty($.THIS, PUBLIC_GETTER, function() {
				return self;
			});
		});
		this.refresh();
	}
	$.extendClass($.copyAll( // class-constructor function
		Context, {CLASS: CLASS, getRoot: getRoot}
	),{ // super-static prototype object
		has: has,
		isFunction: isFunction,
		getQuiet: getQuiet,
		get: get,
		set: set,
		remove: remove,
		refresh: refresh,
		destroy: destroy,
		getIdCount: getIdCount,
		getIdArray: getIdArray,
		getParent: getParent,
		getRefreshDate: getRefreshDate
	});
	
	CONTEXT = new Context();

	//
	// Functions
	//
	
	/**
	 * Get the ROOT Context.
	 */
	function getRoot() {
		return CONTEXT;
	}
	
	/**
	 * Refresh the context, also called during initialisation.
	 */
	function refresh() {
		this.doEvent({ type:"refresh", context:this });
	}
	
	/**
	 * Remove all items from the Context and revert to any parent Context.
	 */
	function destroy() {
		var p = this.PRIVATES(PRIVATES), parent = p.parent || CONTEXT;
		this.doEvent({ type:"destroy", context:this });
		for (var id in p.map) this.remove(id); 
		if (parent) $.setProperty($.THIS, PUBLIC_GETTER, function() {
			return parent;
		});
	}
	
	/**
	 * Get the refresh date (Date).
	 */
	function getRefreshDate() {
		return this.PRIVATES(PRIVATES).refreshDate;
	}
	
	/**
	 * Get the parent Context or null.
	 */
	function getParent() {
		return this.PRIVATES(PRIVATES).parent;
	}
	
	/**
	 * Check if the item at the given id is a function/constructor as opposed to an object/instance.
	 * This does not fire any "has","get","isFunction" event, and will check the parent.
	 */
	function isFunction(id) {
		return typeof this.getQuiet(id) === "function";
	}

	/**
	 * Check for the object/instance at the given key/id, returning true/false.
	 * This does not fire any "has" event, and will check the parent.
	 */
	function has(id) {
		var p = this.PRIVATES(PRIVATES);
		return (id in p.map || (p.parent && p.parent.has(id)));
	}
	
	/** 
	 * Similar to .get(id) but does not fire any event and does not invoke a mapped function/constructor.
	 * This also checks the parent.
	 */
	function getQuiet(id) {
		var p = this.PRIVATES(PRIVATES);
		var o = p.map[id];
		if (o === undefined && p.parent) o = p.parent.get(id);
		return o;
	}
	
	/**
	 * Get the object/instance at the given key/id or null.
	 * Will NOT return undefined, and will check the parent.
	 */
	function get(id) {
		var o = this.getQuiet(id);
		if (typeof o === "function") o = $.newApplyArgs(o, Array.prototype.slice.call(arguments, 1));
		if (o === undefined) o = null;
		this.doEvent({ type:"get", context:this, id:id, instance:o });
		return o;
	}
	
	/**
	 * Set the given object/instance to the given key/id, returning any existing one or null.
	 * This does NOT affect the parent.
	 */
	function set(id, instance) {
		var p = this.PRIVATES(PRIVATES), map = p.map;
		if (!(id in map)) p.count++;
		var old = map[id];
		map[id] = instance;
		this.doEvent({ type:"set", context:this, id:id, instance:instance, oldInstance:old });
		return old;
	}

	/**
	 * Removes the instance at the given id, returning the existing one.
	 * This does NOT affect the parent.
	 */
	function remove(id) {
		var p = this.PRIVATES(PRIVATES), map = p.map;
		if (id in map) p.count--;
		var old = map[id];
		delete map[id];
		this.doEvent({ type:"remove", context:this, id:id, instance:old });
		return old;
	}

	/**
	 * Get the count of id/key items in this Context map, not including the parent.
	 */
	function getIdCount() {
		return this.PRIVATES(PRIVATES).count;
	}

	/**
	 * Get an Array of id/key items in this Context map, not including the parent.
	 */
	function getIdArray() {
		var a=[], i=0;
		for (var key in this.PRIVATES(PRIVATES).map) a[i++] = key;
		return a;
	}

})(akme, "akme.core.Context");


/**
 * akme.core.AppContext
 */
(function($,CLASS) {
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var Super = akme.core.Context; 

	//
	// Initialise instance and public functions
	//
	function AppContext(refreshFnOrHandleEventOb) {
		Super.call(this,function(ev){
			if (console.logEnabled) console.log(CLASS+"()");
			ev.callback = refreshFnOrHandleEventOb;
			refresh(ev);
		});
	}
	$.extendClass($.copyAll( // class-constructor function
		AppContext, {CLASS: CLASS, getRoot: Super.getRoot}
	), $.copyAll(Object.create( Super.prototype ), { // super-static prototype object
		
	}));
	$.setProperty($.THIS, CLASS, AppContext);

	//
	// Functions
	//
	
	function refresh(ev) {
		if (ev.callback) $.handleEvent(ev.callback, ev);
	}
	
})(akme, "akme.core.AppContext");

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


akme.copyAll(akme, {
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
		if (data == null) return map;
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
		if (content !== undefined) xhr.send(content);
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
		for (var key in headers) if ("call"!=key && headers[key] !== undefined) a[a.length] = key +": "+ headers[key];
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
        // Note the true Origin of the message in the headers.
        headers["X-Message-Origin"] = messageEvent.origin;
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
	XMLHttpResponse : function(headers, content, messageEvent) {
        // Note the true Origin of the message in the headers.
        headers["X-Message-Origin"] = messageEvent.origin;
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
// Add more to the akme object.
/*jshint browser:true */
/*globals akme */

akme.copyAll(akme, {

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
		while (currentNode &&
				currentNode.parentNode &&
				currentNode != currentNode.parentNode) {
			currentNode = currentNode.parentNode;
			if(currentNode.nodeName == tagNameUpper) {
				var tagClassName = currentNode.className;
				if (!tagClassName) continue;
				for (var j=0 ; j<classAry.length ; j++) {
					className = classAry[j];
					var pos = tagClassName.indexOf(className);
					if (pos === -1) continue;
					if ((pos === 0 || " " == tagClassName.charAt(pos-1)) &&
							(pos+className.length == tagClassName.length || " " == tagClassName.charAt(pos+className.length))) {
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
			obj.$ = dom.nodeValue;
		}
		if (dom.hasChildNodes()) { // children
			var name, a;
			for (var i = 0; i < dom.childNodes.length; i++) {
				name = dom.childNodes[i].nodeName;
				if (obj[name] === undefined) {
					obj[name] = this.xml2js(dom.childNodes[i]);
				} else {
					a = obj[name];
					if (a.length === undefined) a = [a];
					if (typeof a == 'object') a[a.length]=(this.xml2js(dom.childNodes[i]));
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
				(items[i][0] ? items[i][0]+" : " : "") + (i===0 ? items[i][1] : items[i][1]-items[i-1][1])
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
		var elem0 = elem instanceof NodeList ? elem[0] : elem,
            nodeName = elem0.nodeName.toLowerCase();
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
		if (this.timestamp === 0) {
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


akme.copyAll(akme.xhr, {
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
    if (hsv[2]===0) return [0, 0, 0];
    var hue = hsv[0]%360,
        sat = hsv[1]/100,
        val = hsv[2]/100;
    hue = hue/60;
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
    var x, f, i, hue, sat, val;
    var red = rgb[0]/255,
        grn = rgb[1]/255,
        blu = rgb[2]/255;
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
	n=parseInt(n); if (n===0 || isNaN(n)) return "00";
	n=Math.max(0,n); n=Math.min(n,255); n=Math.round(n);
	return "0123456789ABCDEF".charAt((n-n%16)/16) +
    	"0123456789ABCDEF".charAt(n%16);
};
// akme-storage.js
/*jshint browser:true */
/*globals akme */

/**
 * Improvements over standard sessionStorage and localStorage.
 * Also cookieStorage support is defined but is typically a defunct idea. 
 *
// W3C sessionStorage in memory and 5MB localStorage on disk, no need for Cookies.
// This says "any data" for the item value but browsers typically only support a string.
interface Storage {
  readonly attribute unsigned long length;
  getter DOMString key(in unsigned long index);
  getter any getItem(in DOMString key);
  setter creator void setItem(in DOMString key, in any data);
  deleter void removeItem(in DOMString key);
  void clear();
};
*/

/**
 * akme.dom.Storage
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
	function Storage(storage) {
		$.core.EventSource.apply(this); // Apply/inject/mix EventSource functionality into this.
		this.getStorage = function() { return storage; };
	}
	$.extendClass($.copyAll( // class constructor
		Storage, {CLASS: CLASS} 
	), { // super-static prototype, public functions
		getItem : getItem,
		getItemJSON : getItemJSON, 
		setItem : setItem,
		setItemJSON : setItemJSON,
		removeItem : removeItem,
		getAll : getAll,
		setAll : setAll,
		removeAll : removeAll,
		exportAll : exportAll,
		importAll : importAll,
		clear : clear
	});
	$.setProperty($.THIS, CLASS, Storage);
	
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
	 * Get an item value converted to JS from JSON given the collection/type name and key.
	 */
	function getItemJSON(/*string*/ type, /*string*/ key) { 
		var value = akme.parseJSON(this.getStorage().getItem(type+SPLIT_CHAR+key));
		this.doEvent({ type:"getItem", keyType:type, key:key, value:value });
		return value;
	}
	
	/**
	 * Set the item value given the collection/type name and key.
	 */
	function setItem(/*string*/ type, /*string*/ key, /*string*/ value) { 
		this.getStorage().setItem(type+SPLIT_CHAR+key, value);
		this.doEvent({ type:"setItem", keyType:type, key:key, value:value });
	}

	/**
	 * Set the item value converting JS to JSON for the given collection/type name and key.
	 */
	function setItemJSON(/*string*/ type, /*string*/ key, /*string*/ value) { 
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
		for (var i=0; i<storage.length; i++) {
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
		for (var i=storage.length-1; i>=0; i--) { // in reverse to remove
			var key = storage.key(i);
			if (key.lastIndexOf(starts, starts.length) === 0) {
				storage.removeItem(key);
				count++;
			}
		}
		this.doEvent({ type:"removeAll", keyType:type, count:count });
	}
	
	function exportAll() {
		var storage = this.getStorage();
		var result = {};
		var count = 0;
		for (var i=0; i<storage.length; i++) {
			result[storage.key(i)] = storage.getItem(storage.key(i));
			count++;
		}
		this.doEvent({ type:"exportAll", count:count, result:result });
		return result;
	}
	
	function importAll(/*object*/ map) {
		var storage = this.getStorage();
		var count = 0;
		for (var key in map) {
			storage.setItem(key, map[key]);
			count++;
		}
		this.doEvent({ type:"importAll", count:count });
	}
	
	function clear() {
		var count = this.size();
		this.getStorage().clear();
		this.doEvent({ type:"clear", count:count });
	}
	
})(akme,"akme.dom.Storage");


/**
 * akme.localStorage
 */
if (!akme.localStorage) akme.localStorage = new akme.dom.Storage({
	name : "localStorage",
	length : typeof localStorage !== "undefined" ? localStorage.length : 0,
	size : function() { this.length = localStorage.length; return this.length; },
	key : function(idx) { return localStorage.key(idx); },
	getItem : function(key) { return localStorage.getItem(key); },
	setItem : function(key, value) { localStorage.setItem(key, value); this.length = localStorage.length; },
	removeItem : function(key) { localStorage.removeItem(key); this.length = localStorage.length; },
	clear : function() { localStorage.clear(); this.length = localStorage.length; }
});

/**
 * akme.sessionStorage
 */
if (!akme.sessionStorage) akme.sessionStorage = new akme.dom.Storage({
	name : "sessionStorage",
	length : typeof sessionStorage !== "undefined" ? sessionStorage.length : 0,
	size : function() { this.length = sessionStorage.length; return this.length; },
	key : function(idx) { return sessionStorage.key(idx); },
	getItem : function(key) { return sessionStorage.getItem(key); },
	setItem : function(key, value) { sessionStorage.setItem(key, value); this.length = sessionStorage.length; },
	removeItem : function(key) { sessionStorage.removeItem(key); this.length = sessionStorage.length; },
	clear : function() { sessionStorage.clear(); this.length = sessionStorage.length; }
});
// akme-couch.js
/*jshint browser: true */
/*globals akme */

/*
		var shiftAccess = new akme.core.CouchAsyncAccess("shiftdb", "../proxy/couchdb.jsp?/shiftdb");
		shiftAccess.key = function(location, date, time) {
			return location+"_"+date+"_"+time;
		};
		cx.set('shiftAccess', shiftAccess);
 */

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
		this.cacheMap = {};
		var dataConstructor = $.getProperty($.THIS, name);
		if (typeof dataConstructor === "function") this.dataConstructor = dataConstructor;
		$.core.EventSource.apply(this); // Apply/inject/mix EventSource functionality into this.
		//$.extendDestroy(this, function(){});
	}
	$.extendClass($.copyAll(
		CouchAsyncAccess, {CLASS: CLASS}
	), $.copyAll(new $.core.Access(), {
		clear : clear, // given Object return undefined/void
		findOne : findOne, // given Object return Object
		info : info, // given key return Object
		copy : copy, // given key,newKey return Object
		read : read, // given key return Object
		readMany : readMany, // given Array or Object of keys return Array of Objects
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
			if (xhr.readyState==4) $.handleEvent(callbackFnOrOb, {type:"readystatechange", target:xhr}); 
		};
		if (content !== undefined) xhr.send(content);
		else xhr.send();
		return;
	}
	
	function getResponseHeaders(headers, xhr) {
		if (!headers) headers = {};
		headers.status = xhr.status;
		headers.statusText = xhr.statusText; 
		for (var name in {"Cache-Control":1,"Content-Encoding":1,"Content-Length":1,"Content-Type":1,
			"Date":1,"ETag":1,"Expires":1,"Last-Modified":1,"Pragma":1,"Server":1,"Vary":1,"Warning":1}) {
			var val = xhr.getResponseHeader(name);
			if (val) headers[name] = val;
		}
		return headers;
	}
	
	/**
	 * Clear the cacheMap or sessionStorage cache of any of these objects.
	 */
	function clear() {
		if (this.cacheMap) this.cacheMap = {};
		else $.sessionStorage.removeAll(this.name);
	}

	function findOne(map) {
		var ary = this.find(map);
		return ary.length === 0 ? ary[0] : null;
	}
	
	/**
	 * Just get an Object/Map of the HEAD/header info related to the key including the ETag or rev (ETag less the quotes).
	 */
	function info(key, newKey, /*function(result,headers)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("HEAD", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var rev = xhr.getResponseHeader("ETag");
			var headers = {id: key, rev: (rev ? rev.replace(/^"|"$/g, "") : null)};
			getResponseHeaders(headers, xhr);
			if (console.logEnabled) console.log("HEAD "+ url, xhr.status, xhr.statusText, headers.rev);
			self.doEvent({ type:"info", keyType:self.name, key:key, info:headers });
			$.handleEvent(callbackFnOrOb, headers, headers);
			self = xhr = key = callbackFnOrOb = null; // closure cleanup 
		}
		return xhr;
	}

	/**
	 * Copy the existing key to the newKey, supply newKey?rev=... to overwrite an existing newKey.
	 */
	function copy(key, newKey, /*function(result,headers)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("COPY", url, {"Accept": CONTENT_TYPE_JSON, "Destination": newKey}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var rev = xhr.getResponseHeader("ETag");
			var headers = {id: key, rev: (rev ? rev.replace(/^"|"$/g, "") : null)};
			getResponseHeaders(headers, xhr);
			if (console.logEnabled) console.log("COPY "+ url, newKey, xhr.status, xhr.statusText, headers.rev);
			self.doEvent({ type:"info", keyType:self.name, key:key, newKey:newKey, info:headers });
			$.handleEvent(callbackFnOrOb, headers, headers);
			self = xhr = key = callbackFnOrOb = null; // closure cleanup 
		}
		return xhr;
	}

	/**
	 * This maintains a copy of the key/value in a cacheMap or sessionStorage.
	 */
	function read(key, /*function(result,headers)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("GET", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var type = $.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("GET "+ url, xhr.status, xhr.statusText, type);
			var headers = getResponseHeaders({}, xhr);
			var value = (xhr.status < 400 && type && type.indexOf(CONTENT_TYPE_JSON)===0) ? xhr.responseText : null;
			if (value) {
				if (this.cacheMap) this.cacheMap[key] = value; 
				else $.sessionStorage.setItem(self.name, key, value);
				value = $.parseJSON(value, reviver);
			} else {
				if (this.cacheMap) delete this.cacheMap[key]; 
				else $.sessionStorage.removeItem(self.name, key);
			}
			if (self.dataConstructor && value) value = new self.dataConstructor(value);
			self.doEvent({ type:"read", keyType:self.name, key:key, value:value, headers:headers });
			$.handleEvent(callbackFnOrOb, value, headers);
			self = xhr = key = callbackFnOrOb = null; // closure cleanup 
		}
		return xhr;
	}

	/**
	 * This maintains a copy of the key/value pairs in a cacheMap or sessionStorage.
	 */
	function readMany(keys, /*function(result,headers)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read() ", keys);
		var self = this;
		var a;
		if (keys instanceof Array) {
			a = new Array(keys.length);
			for (var i=0; i<keys.length; i++) a[i] = encodeURIComponent('"'+keys[i]+'"');
		} else {
			a = [];
			for (var k in keys) a[a.length] = encodeURIComponent('"'+keys[k]+'"');
		}
		var url = self.url+"/_all_docs?include_docs=true&keys=["+a.join(",")+"]";
		var xhr = callAsync("GET", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var type = $.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("GET "+ url, xhr.status, xhr.statusText, type);
			var headers = getResponseHeaders({}, xhr);
			var value = (xhr.status < 400 && type && type.indexOf(CONTENT_TYPE_JSON)===0) ? xhr.responseText : null;
			if (value) {
				value = $.parseJSON(value);
				var rows = value ? value.rows : null;
				if (rows) for (var i=0; i<rows.length; i++) {
					if (this.cacheMap) this.cacheMap[keys[i]] = $.formatJSON(rows[i], replacer);
					else $.sessionStorage.setItem(self.name, keys[i], $.formatJSON(rows[i], replacer));
					a[i] = rows[i];
					if (self.dataConstructor && a[i]) a[i] = new self.dataConstructor(a[i]);
				}
			} else {
				if (keys instanceof Array) for (var i=0; i<keys.length; i++) {
					if (this.cacheMap) delete this.cacheMap[keys[i]];
					else $.sessionStorage.removeItem(self.name, keys[i]);
				}
				else for (var k in keys) {
					if (this.cacheMap) delete this.cacheMap[k];
					else $.sessionStorage.removeItem(self.name, k);
				}
			}
			
			self.doEvent({ type:"readMany", keyType:self.name, keys:keys, value:a, headers:headers });
			$.handleEvent(callbackFnOrOb, a, headers);
			self = xhr = keys = callbackFnOrOb = null; // closure cleanup
		}
		return xhr;
	}

	/**
	 * This maintains a copy of the key/value in a cacheMap or sessionStorage.
	 * This is so the caller doesn't have to manage the _id and _rev directly that are required to PUT in CouchDB.
	 */
	function write(key, value, /*function(result,headers)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".write("+ key +",...)");
		var self = this;
		var valueMap = $.sessionStorage.getItemJSON(self.name, key);
		if (valueMap && valueMap._id) {
			value._id = valueMap._id;
			value._rev = valueMap._rev;
		}
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("PUT", url, 
				{"Accept": CONTENT_TYPE_JSON, "Content-Type": CONTENT_TYPE_JSON}, 
				typeof value == "string" ? value : $.formatJSON(value, replacer),
				handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var type = $.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("PUT "+ url, xhr.status, xhr.statusText, type);
			var headers = getResponseHeaders({}, xhr);
			var result = (type && type.indexOf(CONTENT_TYPE_JSON)===0) ? $.parseJSON(xhr.responseText) : xhr.responseText;
			if (result.ok && result.rev) {
				value._id = result.id;
				value._rev = result.rev;
				if (this.cacheMap) this.cacheMap[key] = value;
				else $.sessionStorage.setItem(self.name, key, $.formatJSON(value, replacer));
			}
			self.doEvent({ type:"write", keyType:self.name, key:key, value:value, headers:headers });
			$.handleEvent(callbackFnOrOb, result, headers);
			self = xhr = key = value = callbackFnOrOb = null; // closure cleanup 
		}
		return xhr;
	}
	
	/**
	 * Remove the given revision or the latest if no rev is given.
	 * Given the complexity of multiple async it's better to move the HEAD server-side just like authentication. 
	 */
	function remove(key, rev, /*function(result,headers)*/ callbackFnOrOb) { 
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
		}
		function callDELETE() {
			url = self.url+"/"+encodeURIComponent(key)+"?rev="+encodeURIComponent(rev);
			callAsyncXHR(xhr, "DELETE", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		}
		function handleState(ev) {
			xhr = ev.target;
			var type = $.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("DELETE "+ url, xhr.status, xhr.statusText, type);
			var headers = getResponseHeaders({}, xhr);
			var result = (type && type.indexOf(CONTENT_TYPE_JSON)===0) ? $.parseJSON(xhr.responseText) : xhr.responseText;
			if (result.ok && result.rev) {
				if (this.cacheMap) delete this.cacheMap[key];
				else $.sessionStorage.removeItem(self.name, key);
			}
			self.doEvent({ type:"remove", keyType:self.name, key:key, headers:headers });
			$.handleEvent(callbackFnOrOb, result, headers);
			self = xhr = url = key = rev = callbackFnOrOb = null; // closure cleanup
		}
		return xhr;
	}
	
})(akme,"akme.core.CouchAsyncAccess");
