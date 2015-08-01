// Make some more W3C DOM standards work in IE8:
// - Element.textContent, Event.target, Event.preventDefault, Event.stopPropagation.
// Object.defineProperty and friends work only for DOM objects in IE8.
// http://msdn.microsoft.com/en-us/library/windows/apps/dd548687%28v=vs.94%29.aspx
// http://stackoverflow.com/questions/1359469/innertext-works-in-ie-but-not-in-firefox
// http://jsperf.com/innerhtml-vs-innertext/7
//

// Only IE8+HTML5 browsers are supported.
if ((document.documentMode && document.documentMode < 8) || !document.documentMode && (
		navigator.userAgent.indexOf("MSIE 6.") != -1 || 
		navigator.userAgent.indexOf("MSIE 7.") != -1 ) ) {
	alert("Only IE8 and HTML5 browsers are supported.  Please upgrade your browser.");
}

if ( document.documentMode && document.documentMode == 8 ) (function(){
	
	// reroute properties to W3C standards
	defineProperty( Element, "innerText", "textContent", true, true );
	defineProperty( Event, "srcElement", "target", true, false );

	// attach functions to W3C standards
	defineFunction( Event, "preventDefault", function () { this.returnValue = false; } );
	defineFunction( Event, "stopPropagation", function () { this.cancelBubble = true; } );
	
	/**
	 * Helper for :target in IE8, will not work in IE7 or below.
	 * Duplicate the :target {} CSS rule as .-target {} and this will toggle that class upon hashchange.
	 * The rules need to be separate, avoiding the comma, since IE8 throws out the :target {} rule as invalid.
	 */
	for (var key in {"load":1,"hashchange":1}) window.attachEvent("on"+key, function(ev) {
		// Check if exists and already a target.
		var el = location.hash.length > 1 ? document.getElementById(location.hash.substring(1)) : null;
		if (el && /(^|\s)-target(\s|$)/i.test(el.className)) return;
		// Remove old targets.
		var elems = document.querySelectorAll(".-target");
		for (var i=0; i<elems.length; i++) {
			var old = elems[i];
			old.className = old.className.replace(/(^|\s)-target(\s|$)/i, " ");
		}
		// Add current target.
		if (el) el.className = el.className.replace(/\s?$/, " -target");
		//alert("#"+ el.id +".("+ el.className +")")
	});
	
	function defineProperty( domConstructor, originalName, attachName, useGetter, useSetter ) {
	    useGetter = !!useGetter;
	    useSetter = !!useSetter;
		var prpd = Object.getOwnPropertyDescriptor( domConstructor.prototype, originalName );
		var prpSetGet = {};
		if ( useGetter ) prpSetGet.get = function () { return prpd.get.call( this ); };
		if ( useSetter ) prpSetGet.set = function ( x ) { return prpd.set.call( this, x ); };
		Object.defineProperty( domConstructor.prototype, attachName, prpSetGet );
	}
	
	function defineFunction( domConstructor, name, delegate ) {
		domConstructor.prototype[name] = delegate;
	}

})();


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
 * Add Object.create(prototype) if not available that creates an Object with the given prototype 
 * without calling the typical constructor function for that prototype.
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
 */
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
if (!Object.keys) Object.keys = (function(){
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
