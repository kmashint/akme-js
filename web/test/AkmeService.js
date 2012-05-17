
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
  /**
   * Provide a simpler common way of registering and unregistering DOM Event handlers.
   */
  onEvent : function (elem, evnt, fnOrHandleEvent) {
    if ("click" === evnt && this.isTouch && fw.onEventTouch) 
      fw.onEventTouch(elem, fnOrHandleEvent);
    else if (this.isW3C) elem.addEventListener(evnt, fnOrHandleEvent, false);
    else elem.attachEvent("on"+evnt, typeof fnOrHandleEvent.handleEvent==="function" ? 
      fw.fixHandleEvent(fnOrHandleEvent).handleEvent : fnOrHandleEvent);
  },
  onLoad : function (fnOrHandleEvent) { 
    this.onEvent(window, "load", fnOrHandleEvent); 
  },
  onUnload : function (fnOrHandleEvent) { 
    this.onEvent(window, "unload", fnOrHandleEvent); 
  },
  unEvent : function (elem, evnt, fnOrHandleEvent) {
    if ("click" === evnt && this.isTouch && fw.unEventTouch) 
      fw.unEventTouch(elem, fnOrHandleEvent);
    else if (this.isW3C) elem.removeEventListener(evnt, fnOrHandleEvent, false);
    else elem.detachEvent("on"+evnt, typeof fnOrHandleEvent.handleEvent==="function" ? 
      fnOrHandleEvent.handleEvent : fnOrHandleEvent);
  },
  /**
   * Return the element of the Event.target, 
   * using the target.parentNode if the target is not an element.
   */ 
  getEventElement : function (ev) {
    return (ev.target.nodeType === 1) ? ev.target : ev.target.parentNode;
  },
  /**
   * Cross-browser cancel of regular DOM events.
   */
  cancelEvent: function (ev) {
    if (evt.preventDefault) { ev.preventDefault(); ev.stopPropagation(); }
    else { ev.returnValue = false; ev.cancelBubble = true; }
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