
if (!this.akme) this.akme = {
  /**
   * Shallow clone as in Java, returning a new/cloned obj.
   * Uses new object.constructor() and then copies hasOwn/non-prototype properties by key.
   */
  clone : function (obj) {
    if (obj === null || obj === undefined) return obj;
    var clone = new obj.constructor();
    for (var key in obj) if (obj.hasOwnProperty(key)) clone[key] = obj[key];
    return clone;
  },
  /**
   * Copy hasOwn/non-prototype key/values from the map to the obj, returning the same obj.
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
  }
};

if (!akme.onEvent) akme.copyAll(akme, {
  // IE8 documentMode or below
  isIE8 : document.documentMode && document.documentMode < 9, 
  // W3C support
  isW3C : "addEventListener" in window, 
  setAttributes : function(elem, map) {
	if (map === null || typeof map === "undefined") return elem;
	for (var key in map) elem.setAttribute(key, map[key]);
    return elem;
  },
  /**
   * Provide a simpler common way of registering and unregistering DOM Event handlers.
   */
  onEvent : function (elem, evnt, fnOrHandleEvent) {
    if (this.isW3C) elem.addEventListener(evnt, fnOrHandleEvent, false);
    else elem.attachEvent("on"+evnt, typeof fnOrHandleEvent.handleEvent==="function" ? 
      fw.fixHandleEvent(fnOrHandleEvent).handleEvent : fnOrHandleEvent);
  },
  onLoad : function (fnOrHandleEvent) { 
    this.onEvent(window, "load", fnOrHandleEvent); 
  },
  onUnload : function (fnOrHandleEvent) { 
    this.onEvent(window, "unload", fnOrHandleEvent); 
  },
  /**
   * Helper to invoke a callback function or {handleEvent:function(ev){...}}.
   */
  handleEvent : function (fnOrHandleEventOb) {
    if (!fnOrHandleEventOb) return;
    var args = Array.prototype.slice.call(arguments, 1);
    if (typeof fnOrHandleEventOb==="function") fnOrHandleEventOb.apply(undefined, args);
    else fnOrHandleEventOb.handleEvent.apply(fnOrHandleEventOb, args);
  },
  /** 
   * Fix for IE8 that does not directly support { handleEvent : function (ev) { ... } }.
   * Ensures internally to be applied only once by setting _ie8fix = true on the object.
   */
  fixHandleEvent : function (self) {
    if (document.documentMode && document.documentMode < 9 && 
        typeof self.handleEvent === "function" && !self.handleEvent._ie8fix) {
      var handleEvent = self.handleEvent;
      self.handleEvent = function(ev) { handleEvent.call(self, ev); };
      self.handleEvent._ie8fix = true;
    }
    return self;
  }
});