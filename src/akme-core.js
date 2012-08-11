// fw-core.js
// First declare some backported (from Mozilla JavaScript documentation) methods from later ECMAScript/JavaScript if missing.
// Then on to akme.*.

// Simple ability to ensure console.log and allow for use of if (console.logEnabled).
// http://www.tuttoaster.com/learning-javascript-and-dom-with-console/
// http://www.thecssninja.com/javascript/console
if (typeof console === "undefined") console = { 
	log : function() {}, info : function() {}, warn : function() {}, error : function() {}, assert : function() {} 
};
if (typeof console.logEnabled === "undefined") console.logEnabled = false;

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
 * Add Object.getPrototypeOf() if not available that returns the prototype of an object.
 * This will only work in IE8 if the object.constructor and constructor.prototype have not been changed.
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/getPrototypeOf
 */
 if ( !Object.getPrototypeOf ) {
	// Before Object.getPrototypeOf, there was the non-standard __proto__ but not in IE8.
	// For IE8, this must fall back to obj.constructor.prototype although that's mutable (but please don't mutate it).
	if ({}.hasOwnProperty("__proto__")) Object.getPrototypeOf = function(obj){ return obj.__proto__; };
	else Object.getPrototypeOf = function(obj){ return obj.constructor.prototype; };
}


/**
 * Add Object.keys() if not available that returns an Array of the hasOwnProperty keys of the given object.
 * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
 */
if (!Object.keys) {
  Object.keys = (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i=0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    };
  })();
};


if (!Array.indexOf) Array.indexOf = (Array.prototype.indexOf) ? 
function(ary) { return Array.prototype.indexOf.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function (ary, searchElement /*, fromIndex */ ) {
     if (ary == null) {  
         throw new TypeError();  
     }  
     var t = Object(ary);
     var len = t.length >>> 0;
     if (len === 0) {
         return -1;  
     }  
     var n = 0;  
     if (arguments.length > 1) {  
         n = Number(arguments[2]);
         if (n != n) { // shortcut for verifying if it's NaN  
             n = 0;  
         } else if (n != 0 && n != Infinity && n != -Infinity) {  
             n = (n > 0 || -1) * Math.floor(Math.abs(n));  
         }  
     }  
     if (n >= len) {
         return -1;  
     }  
     var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
     for (; k < len; k++) {
         if (k in t && t[k] === searchElement) {  
             return k;  
         }  
     }  
		return -1;
};


if (!Array.every) Array.every = (Array.prototype.every) ? 
function(ary) { return Array.prototype.every.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, fun /*, thisp */) {  
	
	 if (ary == null)  
	   throw new TypeError();  
	
	 var t = Object(ary);  
	 var len = t.length >>> 0;  
	 if (typeof fun != "function")  
	   throw new TypeError();  
	
	 var thisp = arguments[2];  
	 for (var i = 0; i < len; i++) {  
	   if (i in t && !fun.call(thisp, t[i], i, t))  
	     return false;  
	 }  
	
	 return true;  
};  


if (!Array.filter) Array.filter = (Array.prototype.filter) ? 
function(ary) { return Array.prototype.filter.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, fun /*, thisp */) {  

	 if (ary == null)  
	   throw new TypeError();  

	 var t = Object(ary);  
	 var len = t.length >>> 0;  
	 if (typeof fun != "function")  
	   throw new TypeError();  

	 var res = [];  
	 var thisp = arguments[2];  
	 for (var i = 0; i < len; i++) {  
	   if (i in t) {  
	     var val = t[i]; // in case fun mutates this  
	     if (fun.call(thisp, val, i, t))  
	       res.push(val);  
	   }
	 }

	 return res;  
};


//Production steps of ECMA-262, Edition 5, 15.4.4.18  
//Reference: http://es5.github.com/#x15.4.4.18  
if (!Array.forEach) Array.forEach = (Array.prototype.forEach) ? 
function(ary) { Array.prototype.forEach.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, callback, thisArg ) {  

	 var T, k;  
	
	 if ( ary == null ) {  
	   throw new TypeError( " this is null or not defined" );  
	 }  
	
	 // 1. Let O be the result of calling ToObject passing the |this| value as the argument.  
	 var O = Object(ary);  
	
	 // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".  
	 // 3. Let len be ToUint32(lenValue).  
	 var len = O.length >>> 0; // Hack to convert O.length to a UInt32  
	
	 // 4. If IsCallable(callback) is false, throw a TypeError exception.  
	 // See: http://es5.github.com/#x9.11  
	 if ( {}.toString.call(callback) != "[object Function]" ) {  
	   throw new TypeError( callback + " is not a function" );  
	 }  
	
	 // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.  
	 if ( thisArg ) {  
	   T = thisArg;  
	 }  
	
	 // 6. Let k be 0  
	 k = 0;  
	
	 // 7. Repeat, while k < len  
	 while( k < len ) {  
	
	   var kValue;  
	
	   // a. Let Pk be ToString(k).  
	   //   This is implicit for LHS operands of the in operator  
	   // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.  
	   //   This step can be combined with c  
	   // c. If kPresent is true, then  
	   if ( k in O ) {  
	
	     // i. Let kValue be the result of calling the Get internal method of O with argument Pk.  
	     kValue = O[ k ];  
	
	     // ii. Call the Call internal method of callback with T as the this value and  
	     // argument list containing kValue, k, and O.  
	     callback.call( T, kValue, k, O );  
	   }  
	   // d. Increase k by 1.  
	   k++;  
	 }  
	 // 8. return undefined  
};  


//Production steps of ECMA-262, Edition 5, 15.4.4.19  
//Reference: http://es5.github.com/#x15.4.4.19  
if (!Array.map) Array.map = (Array.prototype.map) ? 
function(ary) { return Array.prototype.map.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, callback, thisArg ) {  

	 var T, A, k;  

	 if (ary == null) {  
	   throw new TypeError(" this is null or not defined");  
	 }  

	 // 1. Let O be the result of calling ToObject passing the |this| value as the argument.  
	 var O = Object(ary);  

	 // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".  
	 // 3. Let len be ToUint32(lenValue).  
	 var len = O.length >>> 0;  

	 // 4. If IsCallable(callback) is false, throw a TypeError exception.  
	 // See: http://es5.github.com/#x9.11  
	 if ({}.toString.call(callback) != "[object Function]") {  
	   throw new TypeError(callback + " is not a function");  
	 }  

	 // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.  
	 if (thisArg) {  
	   T = thisArg;  
	 }  

	 // 6. Let A be a new array created as if by the expression new Array(len) where Array is  
	 // the standard built-in constructor with that name and len is the value of len.  
	 A = new Array(len);  

	 // 7. Let k be 0  
	 k = 0;  

	 // 8. Repeat, while k < len  
	 while(k < len) {  

	   var kValue, mappedValue;  

	   // a. Let Pk be ToString(k).  
	   //   This is implicit for LHS operands of the in operator  
	   // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.  
	   //   This step can be combined with c  
	   // c. If kPresent is true, then  
	   if (k in O) {  

	     // i. Let kValue be the result of calling the Get internal method of O with argument Pk.  
	     kValue = O[ k ];  

	     // ii. Let mappedValue be the result of calling the Call internal method of callback  
	     // with T as the this value and argument list containing kValue, k, and O.  
	     mappedValue = callback.call(T, kValue, k, O);  

	     // iii. Call the DefineOwnProperty internal method of A with arguments  
	     // Pk, Property Descriptor {Value: mappedValue, Writable: true, Enumerable: true, Configurable: true},  
	     // and false.  

	     // In browsers that support Object.defineProperty, use the following:  
	     // Object.defineProperty(A, Pk, { value: mappedValue, writable: true, enumerable: true, configurable: true });  

	     // For best browser support, use the following:  
	     A[ k ] = mappedValue;  
	   }  
	   // d. Increase k by 1.  
	   k++;  
	 }  

	 // 9. return A  
	 return A;  
};        


if (!Array.some) Array.some = (Array.prototype.some) ? 
function(ary) { return Array.prototype.some.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, fun /*, thisp */) {  

	 if (ary == null)  
	   throw new TypeError();  

	 var t = Object(ary);  
	 var len = t.length >>> 0;  
	 if (typeof fun !== "function")  
	   throw new TypeError();  

	 var thisp = arguments[2];  
	 for (var i = 0; i < len; i++) {  
	   if (i in t && fun.call(thisp, t[i], i, t))  
	     return true;  
	 }  

	 return false;  
};


if (!Array.reduce) Array.reduce = (Array.prototype.reduce) ? 
function(ary) { return Array.prototype.reduce.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, accumulatorFn) {
   var i = 0, len = this.length >> 0, curr;

   if(typeof accumulatorFn !== "function") // ES5 : "If IsCallable(callbackfn) is false, throw a TypeError exception."
     throw new TypeError("First argument is not callable");

   if (arguments.length < 3) {
     if (len === 0) throw new TypeError("Array length is 0 and no second argument");
     curr = ary[0]; // Increase i to start searching the secondly defined element in the array
     i = 1; // start accumulating at the second element
   }
   else
     curr = arguments[2];

   while (i < len) {
     if(i in this) curr = accumulatorFn.call(undefined, curr, this[i], i, this);
     ++i;
   }

   return curr;
};


if (!Array.reduceRight) Array.reduceRight = (Array.prototype.reduceRight) ? 
function(ary) { return Array.prototype.reduceRight.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, callbackfn /*, initialValue */) {

	 if (ary == null)
	   throw new TypeError();

	 var t = Object(ary);
	 var len = t.length >>> 0;
	 if (typeof callbackfn !== "function")
	   throw new TypeError();

	 // no value to return if no initial value, empty array
	 if (len === 0 && arguments.length === 2)
	   throw new TypeError();

	 var k = len - 1;
	 var accumulatorFn;
	 if (arguments.length >= 3) {
		 accumulatorFn = arguments[2];
	 }
	 else {
	   do {
	     if (k in this) {
	    	 accumulatorFn = this[k--];
	       break;
	     }

	     // if array contains no values, no initial value to return
	     if (--k < 0)
	       throw new TypeError();
	   }
	   while (true);
	 }

	 while (k >= 0) {
	   if (k in t)
		   accumulatorFn = callbackfn.call(undefined, accumulatorFn, t[k], k, t);
	   k--;
	 }

	 return accumulatorFn;
};


if (!this.akme) this.akme = {
	WHITESPACE_TRIM_REGEXP : /^\s*|\s*$/,
	PRINTABLE_EXCLUDE_REGEXP : /[^\x20-\x7e\xc0-\xff]/g,
		
	/**
	 * Concat a collection to an array and return it, helpful for HTMLCollection results of getElementsByTagName.
	 */
	concat : function (ary, coll) {
		for (var i=0; i<coll.length; i++) ary[ary.length]=(coll[i]);
		return ary;
	},
	/**
	 * Shallow clone as in Java, returning a new/cloned obj.
	 * Uses new object.constructor() and then copies hasOwnProperty/non-prototype properties by key.
	 */
	clone : function (obj) {
		if (obj === null || obj === undefined) return obj;
		if (typeof obj.clone === "function") return obj.clone();
		var clone = new obj.constructor();
		for (var key in obj) if (obj.hasOwnProperty(key)) clone[key] = obj[key];
		return clone;
	},
	/**
	 * Copy hasOwnProperty/non-prototype key/values from the map to the obj, returning the same obj.
	 */
	copy : function (obj, map) {
		if (map === null || typeof map === "undefined") return obj;
		for (var key in map) if (map.hasOwnProperty(key)) obj[key] = map[key];
		return obj;
	},
	/**
	 * Copy key/values from the map to the obj, returning the same obj.
	 */
	copyAll : function (obj, map) {
		if (map === null || typeof map === "undefined") return obj;
		for (var key in map) obj[key] = map[key];
		return obj;
	},
	/**
	 * Copy values from the map to the obj for existing keys in the obj, returning the same obj.
	 */
	copyExisting : function (obj, map) {
		if (map === null || typeof map === "undefined") return obj;
		for (var key in map) if (key in obj) obj[key] = map[key];
		return obj;
	},
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
		/* // Interesting way to add properties to functions, but more complicated than nested functions.
		var old = obj[fcnName] && !obj[fcnName].array ? obj[fcnName] : null;
		if (!(obj[fcnName] && obj[fcnName].array)) {
			obj[fcnName] = function() {
				var r = latestFirst ? null : []; // closure
				for (var a = this[fcnName].array, s = this.constructor.constructor; ;
						a = s.prototype.array, s = s.prototype.constructor.constructor) {
					if (a) {
						if (r) for (var i=a.length-1; i>=0; i--) r.push(a[i]);
						else for (var i=a.length-1; i>=0; i--) a[i].apply(this, arguments);
					}
					if (!s) break;
				}
				if (r) for (var i=0; i<r.length; i++) r[i].apply(this, arguments);
			};
			obj[fcnName].array = [];
		}
		if (old && old !== fcn) obj[fcnName].array.push(old);
		obj[fcnName].array.push(fcn);
		*/
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
(function($,$$){
	if ($$.Access) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	var self = $.extend(Object, function() {
		//$.extendDestroy(this, function(){});
	});
	$.copy(self.prototype, {
		clear : null, // any use as related to JPA EntityManager?
		flush : null, // any use as related to JPA EntityManager?
		sync : null, // instead of refresh? sync is better with HTML5 Offline Apps
		syncDecorator : null, // given Array return void,
		find : null, // return Array
		findOne : null, // return Object
		findDecorator : null, // given Array return void,
		read : null, // return Object
		readDecorator : null, // given Object return void,
		write : null, // given Object return Object
		remove : null // given Object return Object
	});
	self.name = "akme.core.Access";
	$$.Access = self;
	
	//
	// Functions
	//
	
})(akme,akme.core);


/**
 * akme.core.Data
 */
(function($,$$){
	
	//
	// Private static declarations / closure
	//
	
	//
	// Initialise constructor or singleton instance and public functions
	//
	var self = $.extend(function() {
	}, {
		toString : toString
	});
	self.name = "akme.core.Data";
	$$.Data = self;

	//
	// Functions
	//
	
	function toString() {
		return this.constructor.name+$.formatJSON(this);
	}
	
})(akme,akme.core);



/**
 * akme.core.IndexedMap
 */
(function($,$$){
	if ($$.IndexedMap) return; // One-time.
  
	//
	// Private static declarations / closure
	//
	var CLASS = "akme.core.IndexedMap";
	function PRIVATES(self) { return self.privates(PRIVATES); }

	//
	// Initialise constructor or singleton instance and public functions
	//
	function IndexedMap(storage) {
		var p = { map : {}, ary : [] }; // private closure
		function privates(caller) { return caller === PRIVATES ? p : undefined; };
		
		this.length = p.ary.length;
		this.privates = privates;
	};
	$$.IndexedMap = $.extend($.copyAll( // class constructor
		Storage, {name: CLASS} 
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
	function linkMapTo (obj,key) { obj[key] = PRIVATES(this).map; return this; };
	function size () { return PRIVATES(this).ary.length; };
	function keys () { return PRIVATES(this).ary.slice(0); };
	function key (idx) { return PRIVATES(this).ary[idx]; };
	function keySlice (start, end) { 
		return end ? PRIVATES(this).ary.slice(start, end) : PRIVATES(this).ary.slice(start);
	};
	function value (idx) { var p = PRIVATES(this); return p.map[p.ary[idx]]; };
	function values () {
		var p = PRIVATES(this); 
		var r = new Array(p.ary.length);
		for (var i = 0; i < p.ary.length; i++) r[i] = p.map[p.ary[i]];
		return r;
	};
	function valueSlice (start, end) {
		var p = PRIVATES(this);
		if (!(end >= 0)) end = p.ary.length;
		var r = new Array(end-start);
		for (var i = start; i < end; i++) r[i-start] = p.map[p.ary[i]];
		return r;
	};
	function get (key) { return PRIVATES(this).map[key]; };
	function set (key, val) {
		var p = PRIVATES(this); 
		if (!(key in p.map)) {
			p.ary[p.ary.length] = key; this.length = p.ary.length; 
		}
		p.map[key] = val;
	};
	function remove (key) {
		var p = PRIVATES(this); 
		if (!(key in p.map)) return;
		for (var i=0; i<p.ary.length; i++) if (p.ary[i]===key) {
			p.ary.splice(i, 1); this.length = p.ary.length; break;
        }
		delete p.map[key];
	};
	function clear () {
		var p = PRIVATES(this); 
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

})(akme,akme.core);


/**
 * akme.core.EventSource
 * Provide simple event handling NOT related to DOM Events.
 * This is intended to be used via akme.core.EventSource.apply(this) to construct/inject functionality 
 * into objects rather than act as a prototype/super-static.
 */
(function($,$$){
	if ($$.EventSource) return; // One-time.

	//
	// Private static declarations / closure
	//
	var CLASS = "akme.core.EventSource";
	function PRIVATES(self) { return self.events(PRIVATES); }

	//
	// Initialise constructor or singleton instance and public functions
	//
	function EventSource() {
		if (console.logEnabled) console.log(this.constructor.name+" injecting "+CLASS+" arguments.length "+ arguments.length);
		var p = {}; // private closure
		function privates(caller) { return caller === PRIVATES ? p : undefined; };
		
		this.events = privates;
		this.onEvent = onEvent;
		this.unEvent = unEvent;
		this.doEvent = doEvent;

		$.extendDestroy(this, destroy);
	};
	$.Storage = $.extend($.copyAll( // class constructor
		EventSource, {name: CLASS} 
	), { // super-static prototype, public functions
	});
	
	//
	// Functions
	//

	function destroy() {
		if (console.logEnabled) console.log(this.constructor.name+".destroy()");
		var map = PRIVATES(this);
		for (var key in map) delete map[key];
	}
	
	/**
	 * Append the given function to the event handlers for the named event.
	 * The fnOrHandleEventObject can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function onEvent(name, fnOrHandleEventOb) {
		if (!(typeof fnOrHandleEventOb === "function" || typeof fnOrHandleEventOb.handleEvent === "function")) {
			throw new TypeError(this.constructor.name+".onEvent given neither function(ev){...} nor { handleEvent:function(ev){...} }");
		}
		var EVENTS = PRIVATES(this);
		var a = EVENTS[name];
		if (!a) { a = []; EVENTS[name] = a; }
		a.push($.fixHandleEvent(fnOrHandleEventOb));
	}

	/**
	 * Remove the given function from the event handlers for the named event.
	 * The fnOrHandleEventObject can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function unEvent(name, fnOrHandleEventOb) {
		var EVENTS = PRIVATES(this);
		var a = EVENTS[name];
		if (!a) return;
		for (var i=0; i<a.length; i++) if (a[i] === fnOrHandleEventOb) { a.splice(i,1); }
	}

	function doEvent(ev) {
		var EVENTS = PRIVATES(this);
		var a = EVENTS[ev.name];
		if (a) for (var i=0; i<a.length; i++) {
			var eh = a[i];
			if (typeof eh === "function") eh(ev);
			else eh.handleEvent.call(eh, ev);
		}
	}

})(akme,akme.core);
