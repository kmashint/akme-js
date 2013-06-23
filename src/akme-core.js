// fw-core.js

// Simple ability to ensure console.log and allow for use of if (console.logEnabled).
// http://www.tuttoaster.com/learning-javascript-and-dom-with-console/
// http://www.thecssninja.com/javascript/console
if (typeof console === "undefined") console = { 
	log : function() {}, info : function() {}, warn : function() {}, error : function() {}, assert : function() {} 
};
if (typeof console.logEnabled === "undefined") console.logEnabled = false;

/**
 * Utility method on functions to return a short version of a dot-delimited constructor name.
 * Useful for constructor functions, e.g. with obj.constructor.name as "akme.core.EventSource" 
 * and obj.constructor.getShortName() gives "EventSource".
 * If given a parameter, it will look for a name on that function, or object, instead of this function.
 */
if (!Function.prototype.getShortName) Function.prototype.getShortName = function (fn) {
	var name = String(fn ? fn.name : this.name);
	if (name) return name.substring(name.lastIndexOf('.')+1);
	else return;
};

//
// Cross-reference JS 1.5 Array methods against the JS 1.3 Array constructor for backwards compatibility.
//
if (!Array.indexOf) Array.indexOf = 
	function(ary) { return Array.prototype.indexOf.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.lastIndexOf) Array.lastIndexOf = 
	function(ary) { return Array.prototype.lastIndexOf.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.every) Array.every = 
	function(ary) { return Array.prototype.every.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.filter) Array.filter = 
	function(ary) { return Array.prototype.filter.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.forEach) Array.forEach = 
	function(ary) { Array.prototype.forEach.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.map) Array.map = 
	function(ary) { return Array.prototype.map.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.some) Array.some =  
	function(ary) { return Array.prototype.some.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.reduce) Array.reduce = 
	function(ary) { return Array.prototype.reduce.apply(ary, Array.prototype.slice.call(arguments,1)); };

if (!Array.reduceRight) Array.reduceRight = 
	function(ary) { return Array.prototype.reduceRight.apply(ary, Array.prototype.slice.call(arguments,1)); };

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
	copy : function (obj, map) {
		if (map === undefined || map === null) return obj;
		for (var key in map) if (map.hasOwnProperty(key)) obj[key] = map[key];
		return obj;
	},
	/**
	 * Copy key/values from the map to the obj, returning the same obj.
	 */
	copyAll : function (obj, map) {
		if (map === undefined || map === null) return obj;
		for (var key in map) obj[key] = map[key];
		return obj;
	},
	/**
	 * Copy values from the map to the obj for existing keys in the obj, returning the same obj.
	 */
	copyExisting : function (obj, map) {
		if (map === undefined || map === null) return obj;
		for (var key in map) if (key in obj) obj[key] = map[key];
		return obj;
	},
	/**
	 * Copy the array values to the given obj as map keys all with the given value (obj[ary[i][keyName]] = ary[i][valName]).
	 * If valName is undefined or null then the entire array values it used.
	 */
	copyArrayToObject : function (obj, ary, keyName, valName) {
		if (valName === undefined) for (var i=0; i<ary.length; i++) obj[ary[i][keyName]] = ary[i][valName];
		else for (var i=0; i<ary.length; i++) obj[ary[i][keyName]] = ary[i];
		return obj;
	},
	/**
	 * Copy/Append the keys in the map to the given array.
	 */
	copyMapKeys : function(ary, map) {
		for (var k in map) ary[ary.length] = k;
		return ary;
	},
	/**
	 * Get all of the keys in the map as an array.
	 */
	getMapKeys : function(map) {
		return this.copyMapKeys([], map);
	},
	
	/**
	 * Return a nested value from a parent object and a property path string or array.
	 * This supports a nested path by Array ["a","b","c"] or dot-delimited String "a.b.c".
	 */
	getProperty : function ( /*object*/ obj, /*Array or String*/ path ) {
		if ( typeof path === 'string' || path instanceof String ) { path = path.split('.'); }
		var prop = obj;
		var n = path.length;
		for (var i=0; i<n; i++) {
			if (path[i] in prop) prop = prop[path[i]];
			else return;
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
			return eval("(function(F,a){return new F("+ buf.join(",") +");})(fn,args);");
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

	formatIsoDate : function (date) {
		return date.getFullYear()+'-'+this.padLeft(date.getMonth() + 1, 2, '0')+'-'+this.padLeft(date.getDate(), 2, '0');
	}

};


if (!akme.core) akme.core = {};


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
		if (keys instanceof Array) for (var i=0; i<keys.length; i++) {
			a[a.length] = this.read(keys[i]);
		} else if (keys instanceof Object) for (var key in keys) {
			a[a.length] = this.read(key);
		} else if (typeof keys === "function") {
			a[a.length] = this.read(keys());
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
		this.PRIVATES = function() { return this === PRIVATES ? p : undefined; };
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
	function linkMapTo (obj,key) { obj[key] = this.PRIVATES.call(PRIVATES).map; return this; };
	function size () { return this.PRIVATES.call(PRIVATES).ary.length; };
	function keys () { return this.PRIVATES.call(PRIVATES).ary.slice(0); };
	function key (idx) { return this.PRIVATES.call(PRIVATES).ary[idx]; };
	function keySlice (start, end) { 
		return end ? this.PRIVATES.call(PRIVATES).ary.slice(start, end) : this.PRIVATES.call(PRIVATES).ary.slice(start);
	};
	function value (idx) { var p = this.PRIVATES.call(PRIVATES); return p.map[p.ary[idx]]; };
	function values () {
		var p = this.PRIVATES.call(PRIVATES); 
		var r = new Array(p.ary.length);
		for (var i = 0; i < p.ary.length; i++) r[i] = p.map[p.ary[i]];
		return r;
	};
	function valueSlice (start, end) {
		var p = this.PRIVATES.call(PRIVATES);
		if (!(end >= 0)) end = p.ary.length;
		var r = new Array(end-start);
		for (var i = start; i < end; i++) r[i-start] = p.map[p.ary[i]];
		return r;
	};
	function get (key) { return this.PRIVATES.call(PRIVATES).map[key]; };
	function set (key, val) {
		var p = this.PRIVATES.call(PRIVATES); 
		if (!(key in p.map)) {
			p.ary[p.ary.length] = key; this.length = p.ary.length; 
		}
		p.map[key] = val;
	};
	function remove (key) {
		var p = this.PRIVATES.call(PRIVATES); 
		if (!(key in p.map)) return;
		for (var i=0; i<p.ary.length; i++) if (p.ary[i]===key) {
			p.ary.splice(i, 1); this.length = p.ary.length; break;
        }
		delete p.map[key];
	};
	function clear () {
		var p = this.PRIVATES.call(PRIVATES); 
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
	var PRIVATES = {};

	//
	// Initialise constructor or singleton instance and public functions
	//
	function EventSource() {
		if (console.logEnabled) console.log(this.constructor.CLASS+" injecting "+CLASS+" arguments.length "+ arguments.length);
		var p = {eventMap:{}}; // private closure
		this.PRIVATES = function() { return this === PRIVATES ? p : undefined; };
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
		var p = this.PRIVATES.call(PRIVATES);
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
		var p = this.PRIVATES.call(PRIVATES), a = p.eventMap[type];
		if (!a) { a = []; p.eventMap[type] = a; }
		var handler = $.fixHandleEvent(fnOrHandleEventOb);
		a.push({handler:handler, once:!!once});
	}
	
	/**
	 * Remove the given function from the event handlers for the named event.
	 * The fnOrHandleEventObject can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function unEvent(type, fnOrHandleEventOb) {
		var p = this.PRIVATES.call(PRIVATES);
		var a = p.eventMap[type];
		if (!a) return;
		for (var i=0; i<a.length; i++) if (a[i].handler === fnOrHandleEventOb) { a.splice(i,1); }
	}

	/**
	 * Fire the actual event, looping through and calling handlers/listeners registered with onEvent.
	 */
	function doEvent(ev) {
		var p = this.PRIVATES.call(PRIVATES);
		var a = p.eventMap[ev.type];
		if (a) for (var i=0; i<a.length; i++) {
			var eh = a[i];
			if (typeof eh.handler === "function") eh.handler.call(undefined, ev);
			else eh.handler.handleEvent.call(eh.handler, ev);
			if (eh.once) a.splice(i--,1);
		}
	}

})(akme,"akme.core.EventSource");
