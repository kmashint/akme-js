// ..\web\common\akme-core
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
     if (ary == null) throw new TypeError();  
     var t = Object(ary);
     var len = t.length >>> 0;
     if (len === 0) return -1;  
     var n = 0;  
     if (arguments.length > 1) {  
         n = Number(arguments[2]);
         if (n != n) { // shortcut for verifying if it's NaN  
             n = 0;  
         } else if (n != 0 && n != Infinity && n != -Infinity) {  
             n = (n > 0 || -1) * Math.floor(Math.abs(n));  
         }  
     }  
     if (n >= len) return -1;  
     var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
     for (; k < len; k++) {
         if (k in t && t[k] === searchElement)
             return k;  
     }  
	 return -1;
};

if (!Array.lastIndexOf) Array.lastIndexOf = (Array.prototype.lastIndexOf) ? 
function(ary) { return Array.prototype.lastIndexOf.apply(ary, Array.prototype.slice.call(arguments,1)); } :
function(ary, searchElement /*, fromIndex*/) {
    if (ary == null) throw new TypeError();
    var t = Object(ary);
    var len = t.length >>> 0;
    if (len === 0) return -1; 
    var n = len;
    if (arguments.length > 1) {
      n = Number(arguments[1]);
      if (n != n)
        n = 0;
      else if (n != 0 && n != (1 / 0) && n != -(1 / 0))
        n = (n > 0 || -1) * Math.floor(Math.abs(n));
    }
    var k = n >= 0
          ? Math.min(n, len - 1)
          : len - Math.abs(n);
    for (; k >= 0; k--) {
      if (k in t && t[k] === searchElement)
        return k;
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
	THIS : this,
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
	function PRIVATES() { return this.privates.call(PRIVATES); }

	//
	// Initialise constructor or singleton instance and public functions
	//
	function IndexedMap() {
		var p = { map : {}, ary : [] }; // private closure
		function privates() { return this === PRIVATES ? p : undefined; };
		
		this.length = p.ary.length;
		this.privates = privates;
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
	function linkMapTo (obj,key) { obj[key] = PRIVATES.call(this).map; return this; };
	function size () { return PRIVATES.call(this).ary.length; };
	function keys () { return PRIVATES.call(this).ary.slice(0); };
	function key (idx) { return PRIVATES.call(this).ary[idx]; };
	function keySlice (start, end) { 
		return end ? PRIVATES.call(this).ary.slice(start, end) : PRIVATES.call(this).ary.slice(start);
	};
	function value (idx) { var p = PRIVATES.call(this); return p.map[p.ary[idx]]; };
	function values () {
		var p = PRIVATES.call(this); 
		var r = new Array(p.ary.length);
		for (var i = 0; i < p.ary.length; i++) r[i] = p.map[p.ary[i]];
		return r;
	};
	function valueSlice (start, end) {
		var p = PRIVATES.call(this);
		if (!(end >= 0)) end = p.ary.length;
		var r = new Array(end-start);
		for (var i = start; i < end; i++) r[i-start] = p.map[p.ary[i]];
		return r;
	};
	function get (key) { return PRIVATES.call(this).map[key]; };
	function set (key, val) {
		var p = PRIVATES.call(this); 
		if (!(key in p.map)) {
			p.ary[p.ary.length] = key; this.length = p.ary.length; 
		}
		p.map[key] = val;
	};
	function remove (key) {
		var p = PRIVATES.call(this); 
		if (!(key in p.map)) return;
		for (var i=0; i<p.ary.length; i++) if (p.ary[i]===key) {
			p.ary.splice(i, 1); this.length = p.ary.length; break;
        }
		delete p.map[key];
	};
	function clear () {
		var p = PRIVATES.call(this); 
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
	function PRIVATES() { return this.privates.call(PRIVATES); }

	//
	// Initialise constructor or singleton instance and public functions
	//
	function EventSource() {
		if (console.logEnabled) console.log(this.constructor.CLASS+" injecting "+CLASS+" arguments.length "+ arguments.length);
		var p = {eventMap:{}}; // private closure
		function privates() { return this === PRIVATES ? p : undefined; };
		
		this.privates = privates;
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
		var p = PRIVATES.call(this);
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
		var p = PRIVATES.call(this), a = p.eventMap[type];
		if (!a) { a = []; p.eventMap[type] = a; }
		var handler = $.fixHandleEvent(fnOrHandleEventOb);
		a.push({handler:handler, once:!!once});
	}
	
	/**
	 * Remove the given function from the event handlers for the named event.
	 * The fnOrHandleEventObject can be a function(ev){...} or { handleEvent:function(ev){...} }.
	 */
	function unEvent(type, fnOrHandleEventOb) {
		var p = PRIVATES.call(this);
		var a = p.eventMap[type];
		if (!a) return;
		for (var i=0; i<a.length; i++) if (a[i].handler === fnOrHandleEventOb) { a.splice(i,1); }
	}

	/**
	 * Fire the actual event, looping through and calling handlers/listeners registered with onEvent.
	 */
	function doEvent(ev) {
		var p = PRIVATES.call(this);
		var a = p.eventMap[ev.type];
		if (a) for (var i=0; i<a.length; i++) {
			var eh = a[i];
			if (typeof eh.handler === "function") eh.handler.call(undefined, ev);
			else eh.handler.handleEvent.call(eh.handler, ev);
			if (eh.once) a.splice(i--,1);
		}
	}

})(akme,"akme.core.EventSource");
// akme.getContext, akme.App
// Javascript Types: undefined, null, boolean, number, string, function, or object; Date and Array are typeof object.
// Javascript typeof works for a function or object but cannot always be trusted, e.g. typeof String(1) is string but typeof new String(1) is object.
// instanceof is better, but will not work between frames/windows/js-security-contexts due to different underlying prototypes.
// This limitation of instanceof is another reason to use postMessage between frames.
// See Spring AbstractApplicationContext for related basics.
// See refreshSpring.jsp for refreshing a single bean.
//
(function($,CLASS) {
	if ($.getProperty($.THIS,CLASS)) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var CONTEXT,
		//LOCK = [true], // var lock = LOCK.pop(); if (lock) try { ... } finally { if (lock) LOCK.push(lock); }
		INSTANCE_COUNT = 0,
		INSTANCE_MAP = {},
		REFRESH_DATE = null;

	//
	// Initialise instance and public functions
	//
	var self = {
		has: has,
		get: get,
		set: set,
		remove: remove,
		getIdCount: getIdCount,
		getIdArray: getIdArray,
		getRefreshDate: getRefreshDate,
		isFunction: isFunction,
		refresh: refresh
	};
	$.core.EventSource.apply(self); // Apply event handling.
	self.onEvent("refresh", function(ev) {
		REFRESH_DATE = new Date();
	});
	self.refresh();
	CONTEXT = self;

	$.setProperty($.THIS, CLASS, $.copyAll(function() {
		return CONTEXT;
	}, {CLASS: CLASS}));

	//
	// Functions
	//
	
	/**
	 * Refresh the context, also called during initialisation.
	 */
	function refresh() {
		$.CONTEXT = INSTANCE_MAP;
		this.doEvent({ type:"refresh", context:CONTEXT });
	}
	
	/**
	 * Get the refresh date (Date).
	 */
	function getRefreshDate() {
		return REFRESH_DATE;
	}
	
	/**
	 * Check for the object/instance at the given key/id, returning true/false.
	 * This does not fire any "has" event.
	 */
	function has(id) {
		return (id in INSTANCE_MAP);
	}
	
	/**
	 * Get the object/instance at the given key/id or null.
	 * Will NOT return undefined.
	 */
	function get(id) {
		var o = INSTANCE_MAP[id];
		if (typeof o === "function") o = akme.newApplyArgs(o, Array.prototype.slice.call(arguments, 1));
		if (o === undefined) o = null;
		this.doEvent({ type:"get", context:CONTEXT, id:id, instance:o });
		return o;
	}
	
	/**
	 * Set the given object/instance to the given key/id, returning any existing one or null.
	 */
	function set(id, instance) {
		if (!(id in INSTANCE_MAP)) INSTANCE_COUNT++;
		var old = INSTANCE_MAP[id];
		INSTANCE_MAP[id] = instance;
		this.doEvent({ type:"set", context:CONTEXT, id:id, instance:instance, oldInstance:old });
		return old;
	}

	/**
	 * Removes the instance at the given id, returning the existing one.
	 */
	function remove(id) {
		if (id in INSTANCE_MAP) INSTANCE_COUNT--;
		var old = INSTANCE_MAP[id];
		delete INSTANCE_MAP[id];
		this.doEvent({ type:"remove", context:CONTEXT, id:id, instance:old });
		return old;
	}

	function getIdCount() {
		return INSTANCE_COUNT;
	}

	function getIdArray() {
		var a=[], i=0;
		for (key in INSTANCE_MAP) a[i++] = key;
		return a;
	}

	/**
	 * Check if the item at the given id is a function/constructor as opposed to an object/instance.
	 */
	function isFunction(id) {
		return typeof INSTANCE_MAP[id] === "function";
	}

})(akme, "akme.getContext");
// akme-dom.js

(function(self){
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
			if (this.xmldoc.parseError.errorCode != 0) {
				var err = this.xmldoc.parseError;
				throw new SyntaxError("DOMParser error "+ err.errorCode +" at line "+ err.line +" pos "+ err.linepos
					+": "+ err.reason);
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
})(this);

(function(self){
	// Helper for MSIE, MSIE9.
	// http://www.erichynds.com/jquery/working-with-xml-jquery-and-javascript/
	// http://www.vistax64.com/vista-news/284014-domparser-xmlserializer-ie9-beta.html
	// https://github.com/clientside/amplesdk/issues/127
	if (!self.XMLSerializer) self.XMLSerializer = function(){};
	if (!self.XMLSerializer.prototype.serializeToString || (document.documentMode && document.documentMode == 9)) 
		self.XMLSerializer.prototype.serializeToString = function(xmlobj) { return xmlobj.xml; };
})(this);

(function(self){
	// Use new ActiveXObject("Msxml2.ServerXMLHTTP.6.0") to avoid Access is Denied in HTA.
	// For Microsoft Scripting in general: try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
	// catch (er) { throw new ReferenceError("This browser does not support XMLHttpRequest."); }
	if (!self.XMLHttpRequest) self.XMLHttpRequest = function() { 
		try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
		catch (er) { throw new Error("This browser does not support XMLHttpRequest."); }
	}
})(this);


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
	 * Cross-browser cancel of regular DOM events.
	 */
	cancelEvent: function (ev) {
		if (ev.preventDefault) { ev.preventDefault(); ev.stopPropagation(); }
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
		map = map || {}, attrs = elem.attributes;
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
		this.callAsyncXHR(xhr, headers, content, callbackFnOrOb);
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
	submitAsync : function(elem, callbackFnOrOb) {
		var headers = {call:"SubmitRequest"};
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
		self[headers["call"]](headers, {type:'submit', target:elem});
		return headers["callback"];
	},
	handleEvent : function(ev) { // ev.data, ev.origin, ev.source
		var deny = true;
   		var hasDomain = location.hostname.indexOf(".") !== -1 || 
		location.hostname.indexOf(".local",location.hostname.length-6) == location.hostname.length-6;
		if (ev.origin == location.href.substring(0, location.href.indexOf('/', 8)) ||
	   			(!hasDomain && ev.origin.substring(ev.origin.indexOf('/')) ==
	   				location.href.substring(location.href.indexOf('/'), location.href.indexOf('/', 8))
	   			)) deny = false; // allow self both http and https
		if (deny) { console.warn(this.id+" deny "+ ev.origin); return; }
		var data = this.parseMessage(ev.data);
		if (!data.headers.call || typeof this[data.headers.call] !== 'function') return;
		this[data.headers.call].call(this, data.headers, data.content, ev);
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
	StorageResponse : function(headers, content) {
		var callbackFnOrOb = akme.getProperty(window, headers["callback"]);
		if (callbackFnOrOb) {
			akme.handleEvent(callbackFnOrOb, headers, akme.parseJSON(content));
			return;
		}
		if (console.logEnabled) alert(akme.formatJSON(headers)+"\n\n"+content);
	},
	SubmitRequest : function(headers, ev) {
		var self = this;
		var elem = ev.target;
		// TODO: handle <a href=... target=...>...</a> in addition to <form ...>...</form>.
		var elemName = elem.nodeName.toLowerCase();
		if ("form" == elemName) {
			if (typeof elem.onsubmit === "function" && !elem.onsubmit(ev)) returnNullResponse();
			var callback = elem.elements["callback"];
			if (!callback) {
				callback = elem.ownerDocument.createElement("input");
				callback.setAttribute("type", "hidden");
				callback.setAttribute("name", "callback");
				elem.appendChild(callback);
			}
			callback.value = headers["callback"];
			elem.submit();
			return;
		} else {
			if (console.logEnabled) console.log("submitAsync called with unknown Element ", elem);
			returnNullResponse();
		}
		function returnNullResponse() {
			self.SubmitResponse({call:"SubmitResponse", callback:headers["callback"]}, null);
			return;
		}
	},
	SubmitResponse : function(headers, content) {
		var callbackFnOrOb = akme.getProperty(window, headers["callback"]);
		if (callbackFnOrOb) {
			if (/json;|json$/.test(headers["Content-Type"]) && content) content = akme.parseJSON(content);
			akme.handleEvent(callbackFnOrOb, headers, content);
		}
		else if (console.logEnabled) alert(akme.formatJSON(headers)+"\n\n"+content);
	}
});
// Add more to the akme object.

akme.copy(akme, {

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
		while (currentNode 
				&& currentNode.parentNode
				&& currentNode != currentNode.parentNode) {
			currentNode = currentNode.parentNode;
			if(currentNode.nodeName == tagNameUpper) {
				var tagClassName = currentNode.className;
				if (!tagClassName) continue;
				for (var j=0 ; j<classAry.length ; j++) {
					var className = classAry[j];
					var pos = tagClassName.indexOf(className);
					if (pos == -1) continue;
					if ((pos == 0 || " " == tagClassName.charAt(pos-1)) 
							&& (pos+className.length == tagClassName.length || " " == tagClassName.charAt(pos+className.length))) {
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
			obj["$"] = dom.nodeValue;
		}
		if (dom.hasChildNodes()) { // children
			var name, a;
			for (var i = 0; i < dom.childNodes.length; i++) {
				name = dom.childNodes[i].nodeName;
				if (typeof(obj[name]) == 'undefined') {
					obj[name] = this.xml2js(dom.childNodes[i]);
				} else {
					a = obj[name];
					if (typeof(a.length) == 'undefined') a = [a];
					if (typeof(a) == 'object') a[a.length]=(this.xml2js(dom.childNodes[i]));
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
			for (var i=0; i<items.length; i++) a[a.length]=(
				(items[i][0] ? items[i][0]+" : " : "") + (i==0 ? items[i][1] : items[i][1]-items[i-1][1])
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
		var elem0 = elem instanceof NodeList ? elem[0] : elem;
		var nodeName = elem0.nodeName.toLowerCase();
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
		if (this.timestamp == 0) {
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


akme.copy(akme.xhr, {
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
    var hue = hsv[0]%360;
    if (hsv[2]==0) return [0, 0, 0];
    var sat = hsv[1]/100;
    var val = hsv[2]/100;
    var hue = hue/60;
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
    var x, val, f, i, hue, sat, val;
    var red = rgb[0]/255;
    var grn = rgb[1]/255;
    var blu = rgb[2]/255;
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
	n=parseInt(n); if (n==0 || isNaN(n)) return "00";
	n=Math.max(0,n); n=Math.min(n,255); n=Math.round(n);
	return "0123456789ABCDEF".charAt((n-n%16)/16)
    	+ "0123456789ABCDEF".charAt(n%16);
};
// akme-storage.js

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
 * akme.core.Storage
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
	};
	$.extend($.copyAll( // class constructor
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
		for (var i=0; i<storage.length; i++) {
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
	
})(akme,"akme.core.Storage");


/**
 * akme.localStorage
 */
if (!akme.localStorage) akme.localStorage = new akme.core.Storage({
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
if (!akme.sessionStorage) akme.sessionStorage = new akme.core.Storage({
	name : "sessionStorage",
	length : typeof sessionStorage !== "undefined" ? sessionStorage.length : 0,
	size : function() { this.length = sessionStorage.length; return this.length; },
	key : function(idx) { return sessionStorage.key(idx); },
	getItem : function(key) { return sessionStorage.getItem(key); },
	setItem : function(key, value) { sessionStorage.setItem(key, value); this.length = window.sessionStorage.length; },
	removeItem : function(key) { sessionStorage.removeItem(key); this.length = window.sessionStorage.length; },
	clear : function() { sessionStorage.clear(); this.length = window.sessionStorage.length; }
});
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
		clear : clear, // given Object return undefined/void
		findOne : findOne, // given Object return Object
		info : info, // given key return Object
		copy : copy, // given oldKey, newKey return Object
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
	
	/**
	 * Clear the sessionStorage cache of any of these objects.
	 */
	function clear() {
		$.sessionStorage.removeAll(this.name);
	}

	function findOne(map) {
		var ary = this.find(map);
		return ary.length === 0 ? ary[0] : null;
	}
	
	/**
	 * Just get an Object/Map of the HEAD/header info related to the key including the ETag or rev (ETag less the quotes).
	 */
	function info(key) {
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callWithRetry("HEAD", url, {"Accept": CONTENT_TYPE_JSON}, null);
		var rev = xhr.getResponseHeader("ETag");
		var headers = {id: key, rev: (rev ? rev.replace(/^"|"$/g, "") : null), 
				status: xhr.status, statusText: xhr.statusText};
		for (var name in {"Cache-Control":1,"Content-Encoding":1,"Content-Length":1,"Content-Type":1,
				"Date":1,"ETag":1,"Expires":1,"Last-Modified":1,"Pragma":1,"Server":1,"Vary":1,"Warning":1}) {
			var val = xhr.getResponseHeader(name);
			if (val) headers[name] = val;
		}
		if (console.logEnabled) console.log("HEAD "+ url, xhr.status, xhr.statusText, headers["rev"]);
		this.doEvent({ type:"info", keyType:this.name, key:key, info:headers });
		return headers;
	}
	
	/**
	 * Copy the existing key to the newKey, supply newKey?rev=... to overwrite an existing newKey.
	 */
	function copy(key, newKey) {
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callWithRetry("COPY", url, {"Accept": CONTENT_TYPE_JSON, "Destination": newKey}, null);
		var rev = xhr.getResponseHeader("ETag");
		var headers = {id: key, rev: (rev ? rev.replace(/^"|"$/g, "") : null), 
				status: xhr.status, statusText: xhr.statusText};
		for (var name in {"Cache-Control":1,"Content-Encoding":1,"Content-Length":1,"Content-Type":1,
				"Date":1,"ETag":1,"Expires":1,"Last-Modified":1,"Pragma":1,"Server":1,"Vary":1,"Warning":1}) {
			var val = xhr.getResponseHeader(name);
			if (val) headers[name] = val;
		}
		if (console.logEnabled) console.log("COPY "+ url, newKey, xhr.status, xhr.statusText, headers["rev"]);
		this.doEvent({ type:"copy", keyType:this.name, key:key, newKey:newKey, info:headers });
		return headers;
	}
	
	/**
	 * This maintains a copy of the key/value in sessionStorage.
	 */
	function read(key) { //if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callWithRetry("GET", url, {"Accept": CONTENT_TYPE_JSON}, null);
		var type = $.xhr.getResponseContentType(xhr);
		if (console.logEnabled) console.log("GET "+ url, xhr.status, xhr.statusText, type);
		var value = (xhr.status < 400 && type.indexOf(CONTENT_TYPE_JSON)==0) ? xhr.responseText : null;
		if (value) {
			$.sessionStorage.setItem(self.name, key, value);
			value = $.parseJSON(value, reviver);
		} else {
			$.sessionStorage.removeItem(self.name, key);
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
		var valueMap = $.sessionStorage.getItemJSON(self.name, key);
		if (valueMap && valueMap._id) {
			value._id = valueMap._id;
			value._rev = valueMap._rev;
		}
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callWithRetry("PUT", url, 
				{"Accept": CONTENT_TYPE_JSON, "Content-Type": CONTENT_TYPE_JSON}, 
				typeof value == "string" ? value : $.formatJSON(value, replacer));
		var type = $.xhr.getResponseContentType(xhr);
		if (console.logEnabled) console.log("PUT "+ url, xhr.status, xhr.statusText, type);
		var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? $.parseJSON(xhr.responseText) : xhr.responseText;
		if (result.ok && result.rev) {
			value._id = result.id;
			value._rev = result.rev;
			$.sessionStorage.setItem(self.name, key, $.formatJSON(value, replacer));
		}
		this.doEvent({ type:"write", keyType:this.name, key:key, value:value });
		return result;
	}
	
	/**
	 * Remove the given revision or the latest if no rev is given.
	 */
	function remove(key, rev) { //if (console.logEnabled) console.log(this.name +".remove("+ key +")");
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
		var type = $.xhr.getResponseContentType(xhr);
		if (console.logEnabled) console.log("DELETE "+ url, xhr.status, xhr.statusText, type);
		var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? $.parseJSON(xhr.responseText) : xhr.responseText;
		if (result.ok && result.rev) {
			$.sessionStorage.removeItem(self.name, key);
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
		clear : clear, // given Object return undefined/void
		findOne : findOne, // given Object return Object
		info : info, // given key return Object
		copy : copy, // given key,newKey return Object
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
			if (xhr.readyState==4) $.handleEvent(callbackFnOrOb, {type:"readystatechange", target:xhr}); 
		};
		if (typeof content !== "undefined") xhr.send(content);
		else xhr.send();
		return;
	}
	
	/**
	 * Clear the sessionStorage cache of any of these objects.
	 */
	function clear() {
		$.sessionStorage.removeAll(this.name);
	}

	function findOne(map) {
		var ary = this.find(map);
		return ary.length === 0 ? ary[0] : null;
	}
	
	/**
	 * Just get an Object/Map of the HEAD/header info related to the key including the ETag or rev (ETag less the quotes).
	 */
	function info(key, newKey, /*function(result)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("HEAD", url, {"Accept": CONTENT_TYPE_JSON}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var rev = xhr.getResponseHeader("ETag");
			var headers = {id: key, rev: (rev ? rev.replace(/^"|"$/g, "") : null), 
				status: xhr.status, statusText: xhr.statusText};
			for (var name in {"Cache-Control":1,"Content-Encoding":1,"Content-Length":1,"Content-Type":1,
					"Date":1,"ETag":1,"Expires":1,"Last-Modified":1,"Pragma":1,"Server":1,"Vary":1,"Warning":1}) {
				var val = xhr.getResponseHeader(name);
				if (val) headers[name] = val;
			}
			if (console.logEnabled) console.log("HEAD "+ url, xhr.status, xhr.statusText, headers["rev"]);
			self.doEvent({ type:"info", keyType:self.name, key:key, info:headers });
			$.handleEvent(callbackFnOrOb, headers);
			self = xhr = key = callbackFnOrOb = null; // closure cleanup 
		}
		return xhr;
	}

	/**
	 * Copy the existing key to the newKey, supply newKey?rev=... to overwrite an existing newKey.
	 */
	function copy(key, newKey, /*function(result)*/ callbackFnOrOb) { 
		//if (console.logEnabled) console.log(this.name +".read("+ key +")");
		var self = this;
		var url = self.url+"/"+encodeURIComponent(key);
		var xhr = callAsync("COPY", url, {"Accept": CONTENT_TYPE_JSON, "Destination": newKey}, null, handleState);
		function handleState(ev) {
			var xhr = ev.target;
			var rev = xhr.getResponseHeader("ETag");
			var headers = {id: key, rev: (rev ? rev.replace(/^"|"$/g, "") : null), 
				status: xhr.status, statusText: xhr.statusText};
			for (var name in {"Cache-Control":1,"Content-Encoding":1,"Content-Length":1,"Content-Type":1,
					"Date":1,"ETag":1,"Expires":1,"Last-Modified":1,"Pragma":1,"Server":1,"Vary":1,"Warning":1}) {
				var val = xhr.getResponseHeader(name);
				if (val) headers[name] = val;
			}
			if (console.logEnabled) console.log("COPY "+ url, newKey, xhr.status, xhr.statusText, headers["rev"]);
			self.doEvent({ type:"info", keyType:self.name, key:key, newKey:newKey, info:headers });
			$.handleEvent(callbackFnOrOb, headers);
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
			var type = $.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("GET "+ url, xhr.status, xhr.statusText, type);
			var value = (xhr.status < 400 && type.indexOf(CONTENT_TYPE_JSON)==0) ? xhr.responseText : null;
			if (value) {
				$.sessionStorage.setItem(self.name, key, value);
				value = $.parseJSON(value, reviver);
			} else {
				$.sessionStorage.removeItem(self.name, key);
			}
			if (self.dataConstructor && value) value = new self.dataConstructor(value);
			self.doEvent({ type:"read", keyType:self.name, key:key, value:value });
			$.handleEvent(callbackFnOrOb, value);
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
			var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? $.parseJSON(xhr.responseText) : xhr.responseText;
			if (result.ok && result.rev) {
				value._id = result.id;
				value._rev = result.rev;
				$.sessionStorage.setItem(self.name, key, $.formatJSON(value, replacer));
			}
			self.doEvent({ type:"write", keyType:self.name, key:key, value:value });
			$.handleEvent(callbackFnOrOb, result);
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
			var type = $.xhr.getResponseContentType(xhr);
			if (console.logEnabled) console.log("DELETE "+ url, xhr.status, xhr.statusText, type);
			var result = (type.indexOf(CONTENT_TYPE_JSON)==0) ? $.parseJSON(xhr.responseText) : xhr.responseText;
			if (result.ok && result.rev) {
				$.sessionStorage.removeItem(self.name, key);
			}
			self.doEvent({ type:"remove", keyType:self.name, key:key });
			$.handleEvent(callbackFnOrOb, result);
			self = xhr = url = key = rev = callbackFnOrOb = null; // closure cleanup
		};
		return xhr;
	}
	
})(akme,"akme.core.CouchAsyncAccess");
