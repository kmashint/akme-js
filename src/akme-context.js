// akme.getContext
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
	var PRIVATES = {}, // Closure scope guard for this.PRIVATES.
		//LOCK = [true], // var lock = LOCK.pop(); if (lock) try { ... } finally { if (lock) LOCK.push(lock); }
		CONTEXT; // ROOT

	//
	// Initialise instance and public functions
	//
	function Context(parent, refreshFnOrHandleEventOb) {
		if (!(parent instanceof Context)) parent = null;
		var p = { parent: parent, map: {}, count: 0, refreshDate: null };
		this.PRIVATES = function(self){ return self === PRIVATES ? p : undefined; };
		
		$.core.EventSource.apply(this); // Apply/inject/mixin event handling.
		var self = this;
		this.onEvent("refresh", function(ev) {
			p.refreshDate = new Date();
			if (refreshFnOrHandleEventOb) $.handleEvent(refreshFnOrHandleEventOb, ev);
			if (parent) $.setProperty($.THIS, "akme.getContext", function() {
				return self;
			});
		});
		this.refresh();
	}
	$.extend($.copyAll( // class constructors
		Context, {CLASS: CLASS, getRoot: getRoot}
	),{ // static prototype
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
		getRefreshDate: getRefreshDate,
	});
	$.setProperty($.THIS, CLASS, Context);
	
	CONTEXT = new Context();
	$.setProperty($.THIS, "akme.getContext", getRoot);

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
		var p = this.PRIVATES(PRIVATES), parent = p.parent;
		this.doEvent({ type:"destroy", context:this });
		for (var id in p.map) this.remove(id); 
		if (parent) $.setProperty($.THIS, "akme.getContext", function() {
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
		for (key in this.PRIVATES(PRIVATES).map) a[i++] = key;
		return a;
	}

})(akme, "akme.core.Context");
