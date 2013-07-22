// fw-core.js
// Javascript Types: undefined, null, boolean, number, string, function, or object; Date and Array are typeof object.
// Javascript typeof works for a function or object but cannot always be trusted, e.g. typeof String(1) is string but typeof new String(1) is object.
// instanceof is better, but will not work between frames/windows/js-security-contexts due to different underlying prototypes.
// This limitation of instanceof is another reason to use postMessage between frames.

// Simple ability to ensure console.log and allow for use of if (console.logEnabled).
// http://www.tuttoaster.com/learning-javascript-and-dom-with-console/
// http://www.thecssninja.com/javascript/console
if (typeof console === "undefined") console = { 
	log : function(){}, info : function(){}, warn : function(){}, error : function(){}, assert : function(){} 
};
if (typeof console.logEnabled === "undefined") console.logEnabled = false;


// Add safe (from side-effects) compatibility to built-in JS constructor functions like Object, Function, Array.
(function(){
	var ARRAY = Array.prototype,
		SLICE = Array.prototype.slice;
	
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
	 * Return values related to hasOwnProperty keys.
	 */
	if (!Object.values) Object.values = function(obj) {
		var v = [], k = Object.keys(obj);
		for (var i=0; i<k.length; i++) v.push(obj[k[i]]);
		return v;
	};

	//
	// Cross-reference JS 1.5 Array methods against the JS 1.3 Array constructor for backwards compatibility.
	//
	for (var key in {"indexOf":1,"lastIndexOf":1,"every":1,"filter":1,"forEach":1,"map":1,"some":1,"reduce":1,"reduceRight":1}){
		(function(key) {
			if (!Array[key]) Array[key] = function(ary) { return ARRAY[key].apply(ary, SLICE.call(arguments,1)); }; 
		})(key);
	}

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
})();


//
// Define various convenience methods directly on the akme root object.
//
if (!this.akme) this.akme = {
	THIS : this, // reference the global object, e.g. will be window in a web browser
	WHITESPACE_TRIM_REGEXP : /^\s*|\s*$/gm,
	PRINTABLE_EXCLUDE_REGEXP : /[^\x20-\x7e\xc0-\xff]/g,

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
	 * Shallow clone as in Java, returning a new/cloned obj.
	 * Uses new object.constructor() and then copies hasOwnProperty/non-prototype properties by key.
	 */
	clone : function (obj) {
		if (obj === undefined || obj === null) return obj;
		if (typeof obj.clone === "function") return obj.clone();
		var clone = new obj.constructor();
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
	 *   e.g. akme.base.MessageBroker = akme.extend({...object literal prototype...});
	 * If typeof constructFn is an object, this will assume reversed arguments (constructFn, superPrototype).
	 * If needed, refer to the parent constructor function in the constructFn as this.constructor.constructor.
	 * Javascript functions actually have a constructor property, by default an empty Function.
	 */
	extend : function (superNew, constructFn) {
		if (typeof constructFn === "object") {
			var x = superNew; superNew = constructFn; constructFn = x;
		}
		else if (!constructFn) constructFn = function(){};
		constructFn.prototype = typeof superNew === "function" ? new superNew : superNew;
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
	handleEvent : function (fnOrHandleEventOb) {
		if (!fnOrHandleEventOb) return;
		var args = Array.prototype.slice.call(arguments, 1);
		if (typeof fnOrHandleEventOb === "function") fnOrHandleEventOb.apply(undefined, args);
		else fnOrHandleEventOb.handleEvent.apply(fnOrHandleEventOb, args);
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
		if (console.logEnabled) console.log(this.constructor.CLASS+".destroy()");
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


/**
 * akme.core.Promise
 */
(function($,CLASS){
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	// jQuery.Deferred() is the private/producer scope.
	// jQuery.Deferred().promise() is the public/consumer scope.
	// e.g. jQuery.ready.promise creates on first use a private readyList Deferred and returns readyList.promise(startFn).

	//
	// Private static declarations / closure
	//
	var PRIVATES = {}, // Closure guard for privates.
		SLICE = Array.prototype.slice,
		STATE = ["pending","resolved","rejected"], // 0,1,2
		STATE_ARY = ["partAry","doneAry","failAry"], // 0,1,2
		ACTION = [
			// action, listener, state
			[ "resolve", "done", 1 ],
			[ "reject", "fail", 2 ],
			[ "notify", "progress", 0 ]
		];
	function applyToArray(ary, self, args, once) { // IE8 cannot apply null or undefined args.
		for (var i=0; i<ary.length; i++) args ? ary[i].apply(self, args) : ary[i].call(self);
		if (!!once) ary.length = 0;
	};
	function concatFunctionsAndReturn(p, state, self, fcns) {
		if (p.state === 0) $.concat(p[STATE_ARY[state]], fcns);
		else if (p.state === state) applyToArray(fcns, self);
		return self;
	};
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	
	function Promise(fcn) {
		if (!(this instanceof Promise)) return $.newApplyArgs(Promise, arguments);
		var p = { state: 0, self: null, args: null, partAry: [], doneAry: [], failAry: [] }; // private closure
		this.PRIVATES = function(self) { return self === PRIVATES ? p : undefined; };
		var self = this;
		var promise = { // promise as closure-linked subset of methods around p and self
			/** Register the given function(s) to be called on resolution or rejection, success or failure (i.e. finally). */
			always: function() {
				return promise.done.apply(this,arguments).fail.apply(this,arguments);
			},
			/** Purvey/inject the promise closure on another object and return it or return the promise itself. */
			promise: function(obj) { 
				//if (console.logEnabled) console.log("Injecting promise to "+ (obj != null ? "other" : "self"));
				return obj != null ? $.copyAll(obj, promise) : promise;
			},
			/** Return the current state as "pending", "resolved", "rejected". */
			state: function() {
				return STATE[p.state];
			},
			/** Register functions to be called when done, failed, or partial progress is made. */
			then: function(/* doneFn, failFn, partFn */) {
				var fcns = arguments;
				return new Promise(function( newPromise ) {
					Array.forEach(ACTION, function( item, i ) {
						var act = item[0], f = fcns[i];
						self[item[1]](typeof f === "function" ? function(){ 
							var r = f.apply(this, arguments);
							if (r && typeof r.promise === "function") {
								r.promise().done( newPromise.resolve.bind(newPromise) )
									.fail( newPromise.reject.bind(newPromise) )
									.progress( newPromise.notify.bind(newPromise) );
							} else {
								newPromise[act+"With"](this === promise ? newPromise.promise() : this, f ? [r] : arguments);
							}
						} : newPromise[act]	);
					});
					fcns = null; // closure cleanup
				}).promise();
			}
		};
		Array.forEach(ACTION, function( item, i ){
			/** done: Register the given function(s) to be called when resolved with success. */
			/** fail: Register the given function(s) to be called when rejected with failure. */
			/** progress: Register the given function(s) to be called when partial progress is made. */
			promise[item[1]] = function(){
				return concatFunctionsAndReturn(p, item[2], this === self ? promise : this, arguments);
			};
		});
		promise.promise(this);
		if (typeof fcn === "function") fcn.call(this, this);
	};
	$.extend($.copyAll( // class constructor
		Promise, {CLASS: CLASS, make: make, when: when} 
	), { // super-static prototype with public functions
		notify: notify,
		notifyWith: notifyWith,
		resolve: resolve,
		resolveWith: resolveWith,
		reject: reject,
		rejectWith: rejectWith
	});
	$.setProperty($.THIS, CLASS, Promise);
	
	//
	// Class constructor functions
	//
	
	/**
	 * Make a promise calling the given function before progress starts.
	 */
	function make(startFn) {
		return new Promise(startFn);
	}
	
	/**
	 * Return a Promise based on given object(s) which may in turn be Promise(s).
	 * This will wait on them all and fail on first reject, notify about all of them,
	 * and only resolve when all are resolved/done with all of the ([object,...], [arguments,...]) resolved.
	 * If only one sub is given and it's not a promise it will resolve/done with (undefined, sub).
	 * If only sub sub is given and it is a promise then it will progress/fail/done as normal.
	 */
	function when(sub /*, sub2, ... */) {
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
	
	//
	// Functions
	//
	
	function notify() {
		return this.notifyWith(undefined,arguments);
	}
	
	/**
	 * Notify partial progress callbacks,
	 * applying the first argument as "this" for the callbacks.
	 */
	function notifyWith(self,args) {
		applyToArray(this.PRIVATES(PRIVATES).partAry, self, args);
		return this;
	}
	
	/**
	 * Resolve with success and invoke done callbacks.
	 */
	function resolve() {
		return this.resolveWith(undefined,arguments);
	}
	
	/**
	 * Resolve with success and invoke done callbacks,
	 * applying the first argument as "this" for the callbacks.
	 */
	function resolveWith(self,args) {
		var p = this.PRIVATES(PRIVATES);
		switch (p.state) {
		case 0: p.state = 1; p.self = self; p.args = args; // fallthrough
		case 1: applyToArray(p.doneAry, p.self, p.args, true); break;
		case 2: console.warn(String( new RangeError("cannot resolve after reject") ));
		}
		return this;
	}
	
	/**
	 * Reject with failure and invoke fail callbacks.
	 */
	function reject() {
		return this.rejectWith(undefined,arguments);
	}
	
	/**
	 * Reject with failure and invoke fail callbacks,
	 * applying the first argument as "this" for the callbacks.
	 */
	function rejectWith(self,args) {
		var p = this.PRIVATES(PRIVATES);
		switch (p.state) {
		case 0: p.state = 2; p.self = self; p.args = args; // fallthrough
		case 2: applyToArray(p.failAry, p.self, p.args, true); break;
		case 1: console.warn(String( new RangeError("cannot reject after resolve") ));
		}
		return this;
	}
	
})(akme,"akme.core.Promise");
