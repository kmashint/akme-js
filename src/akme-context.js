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
		if (typeof o === "function") o = $.newApplyArgs(o, Array.prototype.slice.call(arguments, 1));
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
