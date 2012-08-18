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

if ( Object.defineProperty && Object.getOwnPropertyDescriptor ) (function(){

	// reroute properties
	routeProperty( Element, "innerText", "textContent", true, true );
	routeProperty( Event, "srcElement", "target", true, false );

	// attach members to mimic functionality from other browsers
	//attachFunction( Element, "addEventListener", function (type, fn) { this.attachEvent("on"+type, fn); } );
	//attachFunction( Element, "removeEventListener", function (type, fn) { this.detachEvent("on"+type, fn); } );
	attachFunction( Event, "preventDefault", function () { this.returnValue = false; } );
	attachFunction( Event, "stopPropagation", function () { this.cancelBubble = true; } );
	
	function routeProperty ( domConstructor, originalName, routedName, useGetter, useSetter ) {
	    useGetter = !!useGetter;
	    useSetter = !!useSetter;
	      
	    if ( !Object.getOwnPropertyDescriptor ( domConstructor.prototype, routedName ).get ) {
	    	var prpd = Object.getOwnPropertyDescriptor ( domConstructor.prototype, originalName );
	        var prpSetGet = {};
	        if ( useGetter ) prpSetGet.get = function () { return prpd.get.call( this ); };
	        if ( useSetter ) prpSetGet.set = function ( x ) { return prpd.set.call( this, x ); };
	        Object.defineProperty ( domConstructor.prototype, routedName, prpSetGet );
	    }
	}
	
	function attachFunction ( domConstructor, name, delegate ) {
		if ( typeof ( domConstructor.prototype[name] ) === "undefined" ) domConstructor.prototype[name] = delegate;
	}

})();

