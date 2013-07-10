// index-test.js
// QUnit tests
//
$(document).ready(function(){

	console.logEnabled = true;
	
	module("akme.extend");
	test("JS inheritance directly", function() {
		if (!window.my) window.my = {};
		
		my.Vehicle = function Vehicle(){};
		(function(self,CLASS){
			  // function scope for a module
			  var DEFAULT_WHEELS = 4;

			  function Car() { 
			    // nested function scope for constructor
			    console.log(this.constructor.CLASS +".constructor() with wheels="+this.wheels);
			  };
			  Car.CLASS = CLASS;
			  Car.constructor = my.Vehicle; // super constructor
			  Car.prototype = new Car.constructor; // super-static prototype
			  Car.prototype.constructor = Car;
			  Car.prototype.wheels = DEFAULT_WHEELS;
			  self.my.Car = Car;

		})(window,"my.Car");
		
		equal(typeof my.Car, "function", "my.Car should be a constructor function");
		ok(my.Car.prototype instanceof my.Vehicle, "my.Car.prototype should be instanceof my.Vehicle");
		ok(my.Car.constructor === my.Vehicle, "my.Car.constructor should be my.Vehicle, the super-constructor, aka this.constructor.constructor");
		var car = new my.Car;
		ok(car instanceof my.Car, "car should be instanceof my.Car");
		ok(car instanceof my.Vehicle, "car should be instanceof my.Vehicle");
	});
	test("JS inheritance with akme.extend", function() {
		(function($,CLASS){
			$.setProperty($.THIS, "my.Vehicle", function Vehicle(){});
			// function scope for a module
			var DEFAULT_WHEELS = 4;

			function Car() { 
			    // nested function scope for constructor
			    console.log(this.constructor.CLASS +".constructor() with wheels="+this.wheels);
			};
			$.extend(
				$.copyAll(Car, {CLASS : CLASS}), // constructor function
				$.copyAll(new my.Vehicle, {wheels: DEFAULT_WHEELS}) // super-static prototype
				);
			$.setProperty($.THIS, CLASS, Car);
		})(akme,"my.Car");
		
		equal(typeof my.Car, "function", "my.Car should be a constructor function");
		ok(my.Car.prototype instanceof my.Vehicle, "my.Car.prototype should be instanceof my.Vehicle");
		ok(my.Car.constructor === my.Vehicle, "my.Car.constructor should be my.Vehicle, the super-constructor, aka this.constructor.constructor");
		var car = new my.Car;
		ok(car instanceof my.Car, "car should be instanceof my.Car");
		ok(car instanceof my.Vehicle, "car should be instanceof my.Vehicle");
	});
	
	module("akme private objects");
	test("", function(){
		(function($,CLASS){

			var PRIVATES = {};

			function X(){
				var p = {x:1};
				this.PRIVATES = function() { return (this === PRIVATES) ? p : undefined; };
			};
			X.prototype = {get:get};
			$.setProperty($.THIS, CLASS, X);
			
			function get(key) {
				return this.PRIVATES.call(PRIVATES)[key];
			}

		})(akme,"my.X");
		
		var x = new my.X();
		equal(x.get("x"), 1, "x should be 1");
		equal(typeof x.PRIVATES, "function", "x.privates should be function");
		equal(typeof x.PRIVATES(), "undefined", "x.privates() should be undefined");
		equal(typeof x.PRIVATES.call({}), "undefined", "x.privates(function(){}) should be undefined");
		
	});

	
	module(akme.core.IndexedMap.CLASS);
	test("basic set/get/remove/clear/copy/link", function() {
		equal( typeof akme.core.IndexedMap, "function", "exists" );

		var imap = new akme.core.IndexedMap();
		imap.set("x", 1);
		equal( imap.get("x"), 1, "get after set" );
		imap.remove("x");
		equal( typeof imap.get("x"), "undefined", "undefined after remove" );
		equal( imap.size(), 0, "size 0 after remove" );
		imap.set("x", 1);
		imap.set("y", 2);
		imap.set("z", 3);
		imap.clear();
		equal( imap.size(), 0, "size 0 after clear" );
		equal( typeof imap.get("x"), "undefined", "x undefined after clear" );
		equal( typeof imap.get("y"), "undefined", "y undefined after clear" );
		equal( typeof imap.get("z"), "undefined", "z undefined after clear" );

		var obj = {}, ary = [];
		ary.push( {cd:"akme", name:"AKME Solutions"} );
		imap = new akme.core.IndexedMap();
		equal( typeof obj.map, "undefined", "linked map" );
		imap.linkMapTo(obj,"map");
		equal( typeof obj.map, "object", "linked map" );
		equal( typeof obj.map["akme"], "undefined", "link to akme" );
		imap.copyFrom(ary, "cd");
		equal( imap.size(), 1, "imap size" );
		equal( typeof obj.map["akme"], "object", "link to akme" );
		equal( obj.map["akme"].name, "AKME Solutions", "link to akme name" );
	});

	
	module(akme.core.EventSource.CLASS);
	test("basics", function() {
		equal( typeof akme.core.EventSource, "function", "exists" );
	});

	module(akme.core.Context.CLASS);
	test("basics", function(){
		var cx = akme.getContext();
		equal( typeof akme.getContext, "function", "exists" );
		ok( cx instanceof akme.core.Context, "instanceof akme.core.Context" );
		cx.set("x", 1);
		equal( cx.get("x"), 1, "set/get x=1" );
		equal( cx.remove("x"), 1, "remove x=1" );
		equal( cx.get("x"), null, "get x should be null");
	});

	module(akme.core.Promise.CLASS);
	test("basics", function() {
		expect(6);
		var promise;
		
		promise = new akme.core.Promise();
		ok( typeof promise.resolve === "function", "maker.resolve should be function" );
		ok( typeof promise.promise().resolve === "undefined", "maker.resolve should be undefined");

		promise.done(function(){ ok(true, "should be done"); });
		promise.resolve();
		ok( promise.state() === "resolved", "state should be resolved");
		
		promise = new akme.core.Promise();
		promise.reject();
		promise.fail(function(){ ok(true, "should be fail even when fail registered after reject"); });
		ok( promise.state() === "rejected", "state should be rejected");
	});
	asyncTest("async", function() {
		expect(3);
		var promise;
		
		promise = akme.xhr.callPromise("GET", location.href);
		promise.always(function(headers,content){
			ok( !(this instanceof XMLHttpRequest), "this is NOT an XMLHttpRequest" );
			if (headers) {
				ok( headers.status === 200 && headers.statusText === "OK", "status is 200 OK" );
				ok( headers["Content-Type"] == "text/html", "Content-Type: text/html" );
			}
			start();
		});

	});
	
	module("akme dom");
	test("get/setAttributes on DOM Element", function(){
		var elem = akme.setAttributes(document.createElement("div"), {id:123});
		var map1 = {id:234};
		var map2 = akme.getAttributes(elem, map1);
		equal( map2.id, 123, "map.id == 123");
		equal( map2.id, map1.id, "map2.id == map1.id");
	});
	test("JSON", function(){
		equal( akme.parseJSON('{"a":1,"b":2,"c":3}')["c"], 3, "parseJSON should give c=3" );
		throws( function(){
			return akme.parseJSON('{"a":1,"b":2,"c":3')["c"];
		}, SyntaxError, "parseJSON should fail to parse with a SyntaxError");
	});
	test("XML", function(){
		equal( akme.parseXML('<o a="1" b="2" c="3"/>').firstChild.getAttribute("c"), 3, "parseXML should give c=3" );
		throws( function(){ 
			try { return akme.parseXML('<o a="1" b="2" c="3"'); } 
			catch (er) { console.log(String(er)); throw er; }
			}, SyntaxError, "parseXML should fail to parse with a SyntaxError" );
		
	});
	
	
	if (akme.sessionStorage) {
	
		module(akme.sessionStorage.constructor.CLASS);
		
		test(akme.sessionStorage.getStorage().name, function() {
			//expect(4);
			ok( !akme.sessionStorage.getItem("test","x"), "item test.x should not yet be stored" );
			ok( !akme.sessionStorage.setItem("test","x",1), "set test.x=1" );
			equal( akme.sessionStorage.getItem("test","x"), "1", "get test.x === String(1)" );
			ok( !akme.sessionStorage.removeItem("test","x"), "remove test.x" );
			equal( typeof akme.sessionStorage.destroy, "function", "has destroy function" );
			equal( typeof akme.sessionStorage.EVENTS, "function", "private EVENTS()" );
			equal( typeof akme.sessionStorage.EVENTS(), "undefined", "private EVENTS() returns undefined" );
			
			var evtFcn = function(ev){ 
				ok(true, "Storage "+ ev.type +" "+ ev.value +" should fire events"); 
			};
			akme.sessionStorage.onEvent("setItem", evtFcn);
			akme.sessionStorage.setItem("test","x",2);
			akme.sessionStorage.unEvent("setItem", evtFcn);
			akme.sessionStorage.onEvent("setItem", function(ev){ 
				ok(false, "Storage "+ ev.type +" "+ ev.value +" should no longer fire events after akme.sessionStorage.destroy()"); 
				} );
			akme.sessionStorage.destroy();
			akme.sessionStorage.setItem("test","x",3);
			akme.core.EventSource.apply(akme.sessionStorage); // fix akme.sessionStorage after intentional destroy
			equal( typeof akme.sessionStorage.destroy, "function", "has destroy function" );
			
			akme.sessionStorage.removeAll("test");
			
		});
	}
	
	if (false && confirm("Test CouchDB?")) {
		var xhr = akme.xhr.open("HEAD", "http://localhost/shiftdb", false);
		xhr.send();
		if (xhr.status < 400) {
			
			module("CouchAccess");
			var couchAccess = new akme.core.CouchAccess("shiftdb", "http://localhost/shiftdb");
			
			test(couchAccess.constructor.CLASS, function() {
				couchAccess.key = function(a,b,c) { return a+"_"+b+"_"+c; };
				var key = couchAccess.key(1,2,3);
				var val = couchAccess.read(key);
				equal(val, null, "val is initially null, not found");
				val = {a:["A","B","C"]};
				couchAccess.write(key, val);
				var obj = couchAccess.read(key);
				equal(akme.formatJSON(obj.a), akme.formatJSON(val.a), 'obj is val ["A","B","C"]');
				couchAccess.remove(key);
				val = couchAccess.read(key);
				equal(val, null, "val is finally null, not found");
			});
			
		}
	}
	
	
	module("W3C standards via fix-ie8");
		
	var manualTest = document.getElementById("manualTest"); 
	if (!manualTest) {
		manualTest = document.createElement("div");
		manualTest.id = "manualTest";
		document.body.appendChild(manualTest);
	}
	
	test("Element.textContent", function() {
		var txt = "hello!";
		var div = document.createElement("div");
		manualTest.appendChild(div);
		div.innerHTML = "hello!";
		equal( div.textContent, txt, "textContent reads text written by innerHTML" );
		manualTest.innerHTML = "";
	});

	manualTest.innerHTML = "Manual Tests to Click";

	test("Event.target", function() {
		expect(0);
		var elem = document.createElement("span");
		manualTest.appendChild(elem);
		var txt = "&bull; ClickMe! Event.target?";
		elem.innerHTML = txt;
		akme.onEvent(elem, "click", function(ev) {
			var t = akme.getEventElement(ev);
			var r = t.nextSibling || document.createElement("span");
			t.parentNode.appendChild(r);
			r.innerHTML = "&nbsp; "+ t +".innerHTML: "+ (t ? t.innerHTML : ""); 
			});
		//div.innerHTML = "";
		//document.body.removeChild(div);
	});
	
	
	module("Raphael SVG/VML");
	
	var div = document.createElement("div");
	akme.copyAll(div, {id: 'raphael'});
	akme.copyAll(div.style, {width: '615px', height: '175px'});
	document.body.appendChild(div);	
	var paper = new Raphael("raphael");
	div.insertBefore(document.createTextNode(div.id), div.firstChild);
	console.log(" width ", paper.width, " height ", paper.height);
	var rect = paper.rect(1, 1, paper.width-15, paper.height-15, 15);
	rect.attr("fill", "transparent");
	var img = paper.image("../akme-logo.gif", 15, 15, 42, 42);
	function goRaphael() {
		var attr = img.attrs.x == 15 ? {y: 100, x: 500} : {y: 15, x: 15};
		img.animate(attr, 700, "bounce"); // easeOut, backOut, bounce, elastic
	};
	img.click(goRaphael);
	setTimeout(function() { goRaphael(); }, 700);
	
	var $div2 = $(document.createElement("div"))
		.attr({id:"jquery"})
		.css({width: "600px", height: "160px", margin: "0", "background-color": "goldenrod"})
		.appendTo(document.body);
	$(document.createTextNode($div2.attr("id"))).insertBefore($div2);
	var $img2 = $(document.createElement("img"))
		.attr({src: "../akme-logo.gif", width: 42, height: 42, border: 0})
		.css({"margin-top": "0px"})
		.appendTo($div2);
	var margin0 = $img2.css("margin-top");
	function goJQuery() {
		var attr = $img2.css("margin-top") == margin0 ? 
			{ "margin-top": "100px", "margin-left": "500px" } : 
			{ "margin-top": "0px", "margin-left": "0px" } ;
		$img2.animate( attr, 700, "easeOutBounce" ); // swing does not need UI; easeOutQuad and easeOutBounce require UI
	};
	$img2.click(goJQuery);
	setTimeout(function() { goJQuery(); }, 700);
	
});