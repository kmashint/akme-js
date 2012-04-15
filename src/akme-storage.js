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
 * akme.Storage
 * Provide underlying functions for akme.localStorage and akme.sessionStorage.
 * This gives the Storage API a collection/type name in addition to the key.
 * The underlying W3C Storage can be retrieved from akme.localStorage.getStorage() or akme.sessionStorage.getStorage().
 */
(function($) {
	if ($.Storage) return; // One-time.
	
	//
	// Private static declarations / closure
	//
	var SPLIT_CHAR = ':';
	
	//
	// Initialise instance and public functions
	//
	var self = $.extend(function(storage) {
		$.core.EventSource.apply(this); // Apply/inject/mix EventSource functionality into this.
		this.getStorage = function() { return storage; };
	}, {
		getItem : getItem,
		setItem : setItem,
		removeItem : removeItem,
		getAll : getAll,
		setAll : setAll,
		removeAll : removeAll
	});
	self.name = "akme.Storage";
	$.Storage = self;
	
	//
	// Functions
	//
	
	/**
	 * Get an item value given the collection/type name and key.
	 */
	function getItem(/*string*/ type, /*string*/ key) { 
		var value = this.getStorage().getItem(type+SPLIT_CHAR+key);
		this.doEvent({ name:"getItem", type:type, key:key, value:value });
		return value;
	}
	
	/**
	 * Set the item value given the collection/type name and key.
	 */
	function setItem(/*string*/ type, /*string*/ key, /*string*/ value) { 
		this.getStorage().setItem(type+SPLIT_CHAR+key, value);
		this.doEvent({ name:"setItem", type:type, key:key, value:value });
	}

	/**
	 * Remove an item value given the collection/type name and key.
	 */
	function removeItem(/*string*/ type, /*string*/ key) { 
		this.getStorage().removeItem(type+SPLIT_CHAR+key); 
		this.doEvent({ name:"removeItem", type:type, key:key });
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
		this.doEvent({ name:"getAll", type:type, count:count, result:result });
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
		this.doEvent({ name:"setAll", type:type, count:count, map:map });
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
		this.doEvent({ name:"removeAll", type:type, count:count });
	}
	
})(akme);


/**
 * akme.localStorage
 */
if (!akme.localStorage && localStorage) akme.localStorage = new akme.Storage({
	name : "localStorage",
	length : localStorage.length,
	key : function(idx) { return localStorage.key(idx); },
	getItem : function(key) { return localStorage.getItem(key); },
	setItem : function(key, value) { localStorage.setItem(key, value); this.length = localStorage.length; },
	removeItem : function(key) { localStorage.removeItem(key); this.length = localStorage.length; },
	clear : function() { localStorage.clear(); this.length = localStorage.length; }
});

/**
 * akme.sessionStorage
 */
if (!akme.sessionStorage && localStorage) akme.sessionStorage = new akme.Storage({
	name : "sessionStorage",
	length : sessionStorage.length,
	key : function(idx) { return sessionStorage.key(idx); },
	getItem : function(key) { return sessionStorage.getItem(key); },
	setItem : function(key, value) { sessionStorage.setItem(key, value); this.length = window.sessionStorage.length; },
	removeItem : function(key) { sessionStorage.removeItem(key); this.length = window.sessionStorage.length; },
	clear : function() { sessionStorage.clear(); this.length = window.sessionStorage.length; }
});
