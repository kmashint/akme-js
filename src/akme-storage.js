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
