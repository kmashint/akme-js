// index-test.js
// QUnit tests
//
/*jshint browser:true, jquery:true, qunit:true */
/*globals Raphael, akme, my */
$(document).ready(function(){
    
    var global = global || window;
    
    if (location.protocol === "file:") {
        window.alert("Warning: Some tests may fail when trying to run from a file: protocol instead of https:/https.");
    }

	console.logEnabled = true;

	module("JS standards");
	test("undefined and null checks", function() {
        raises(function() {
            if (undefinedVar) ;  //jshint ignore:line
        }, Error, "if (undefinedVar) should throw Error, typically ReferenceError but TypeError on IE8");
        ok(typeof undefinedVar !== undefined, "typeof undefinedVar !== undefined, careful!");
        ok(typeof undefinedVar === 'undefined', "typeof undefinedVar === 'undefined'");
        ok(typeof null === 'object', "typeof null === 'object'");
        ok(null !== undefined, "null !== undefined");
        ok(null == undefined, "null == undefined, i.e. undefined, and only it, upcasts to null object");  //jshint ignore:line
        ok(!undefined, "undefined should cast to boolean false");
        ok(!null, "null should cast to boolean false");
        ok(!0, "0 should cast to boolean false");
        ok(!'', "'' (empty string) should cast to boolean false");
        ok(-1, "-1 should cast to boolean true");
        ok(!Number.NaN, "Number.NaN should cast to boolean false");
        ok(Number.NaN != undefined, "Number.NaN != undefined, NaN is a typeof number");  //jshint ignore:line
        ok(Number.NaN != null, "Number.NaN != null, NaN is a typeof number");  //jshint ignore:line
        ok(typeof Number.NaN === "number", "Number.NaN is a typeof number");
    });
	test("JS inheritance directly", function() {
		if (!window.my) window.my = {};
		
		my.Vehicle = function Vehicle(){};
		(function(self,CLASS){
			  // function scope for a module
			  var DEFAULT_WHEELS = 4;

			  function Car() { 
			    // nested function scope for constructor
			    console.log(this.constructor.CLASS +".constructor() with wheels="+this.wheels);
			  }
			  Car.CLASS = CLASS;
			  Car.constructor = my.Vehicle; // super constructor
			  Car.prototype = new Car.constructor(); // super-static prototype
			  Car.prototype.constructor = Car;
			  Car.prototype.wheels = DEFAULT_WHEELS;
			  self.my.Car = Car;

		})(window,"my.Car");
		
		equal(typeof my.Car, "function", "my.Car should be a constructor function");
		ok(my.Car.prototype instanceof my.Vehicle, "my.Car.prototype should be instanceof my.Vehicle");
		ok(my.Car.constructor === my.Vehicle, "my.Car.constructor should be my.Vehicle, the super-constructor, aka this.constructor.constructor");
		var car = new my.Car();
		ok(car instanceof my.Car, "car should be instanceof my.Car");
		ok(car instanceof my.Vehicle, "car should be instanceof my.Vehicle");
	});

	
	module("akme utility functions");
	test("akme isEmpty", function(){
		equal( akme.isEmpty(), true, "undefined should be empty");
        equal( akme.isEmpty(null), true, "null should be empty");
        equal( akme.isEmpty(false), true, "false should be empty");
        equal( akme.isEmpty(0), true, "0 should be empty");
        equal( akme.isEmpty([]), true, "[] should be empty");
        equal( akme.isEmpty({}), true, "{} should be empty");
        
        equal( akme.isEmpty(true), false, "true should be non-empty");
        equal( akme.isEmpty(1), false, "1 should be non-empty");
        equal( akme.isEmpty([0]), false, "[0] should be non-empty");
        equal( akme.isEmpty({"x":1}), false, '{"x":1} should be non-empty');
        equal( akme.isEmpty(function(){}), false, "function(){} should be non-empty");
	});
	test("akme.copy() and friends", function(){
		var x = {a:1},
            y = {a:2, b:2},
            Constructor = String,
            z = {a:1, b:{d:2}, c:[3,4], d:/^d/, e:new Constructor("e")},
            c;
        
        c = akme.clone(z, true);
        //window.alert(JSON.stringify(c) +" cloned from "+ JSON.stringify(z));
        ok(c !== z, "clone should not be the same instance as its source");
        ok(c.a === z.a, "the clone.a property should be the same");
        ok(c.b !== z.b, "the clone.b property should not be the same instance as its source");
        ok(c.c instanceof Object, "the clone.c property should be an Object");
        ok(c.b.d === z.b.d, "the clone.b.d property should be the same");
        ok(c.c !== z.c, "the clone.c property should not be the same instance as its source");
        ok(c.c instanceof Array, "the clone.c property should be an Array");
        ok(c.c[0] === z.c[0] && c.c[1] === z.c[1], "the clone.c Array should contain the same values");
        ok(c.d !== z.d, "the clone.d RegExp should not contain the exact same value");
        ok(c.d.test("d"), "the clone.d RegExp should be able to test()");
        ok(c.e !== z.e, "the clone.d new String should not contain the exact same value");
        ok(String(c.e) == String(z.e), "the clone.e new String should contain a similar String() value");
        
        c = akme.clone(z);
        ok(c !== z, "clone should not be the same instance as its source");
        ok(c.a === z.a, "the clone.a property should be the same");
        ok(c.b === z.b, "the clone.b property should be the same instance as its source");
        ok(c.c === z.c, "the clone.c property should be the same instance as its source");
        ok(c.d === z.d, "the clone.d property should be the same instance as its source");
        ok(c.e === z.e, "the clone.e property should be the same instance as its source");
        		
		akme.copy(x, y);
		equal( x.a, 2, "copy() should set a=2" );
		equal( x.b, 2, "copy() should set b=2" );
		
		x = {a:1};
		akme.copyExisting(x, y);
		equal( x.a, 2, "copyExisting() should set a=2" );
		equal( typeof x.b, "undefined", "copyExisting() should leave b undefined" );
		
		x = {a:1};
		akme.copyMissing(x, y);
		equal( x.a, 1, "copyMissing() should leave a=1" );
		equal( x.b, 2, "copyMissing() should set a=2" );

        y = [1,2];
        x = y.some(function (val, key) {
            if (val === 1 && key === 0) return val;
            if (val === 2) ok(false, "some() should stop at 0:1");
        });
        ok(x === true, "some() should return true" );
        
        y = [1,2];
        x = akme.some(y, function (val, key) {
            if (val === 1 && key === 0) return val;
            if (val === 2) ok(false, "some() should stop at 0:1");
        });
        ok(x === true, "some() should return true" );
        
        y = {a:1, b:2};
        x = akme.some(y, function(val, key) {
            if (val === 1 && key === "a") return val;
            if (val === 2) ok(false, "some() should stop at a:1");
        });
        ok(x === true, "some() should return true" );

	});
	test("akme date utils", function(){
		var now = new Date(),
			date = new Date(now);
		
		equal( akme.formatIsoDate(akme.parseDate("2011-12-31")), akme.formatIsoDate(new Date(2011, 12-1, 31)), "should be 2011-12-31" );
		
		date.setHours(date.getHours()-10);
		equal( akme.diffDays(date, now), 0, "should be 0 for -10 hours" );

		date.setHours(date.getHours()-10);
		equal( akme.diffDays(date, now), 1, "should be 1 for -20 hours" );

		date.setHours(date.getHours()-4);
		equal( akme.diffDays(date, now), 1, "should be 1 for -24 hours" );

		date.setHours(date.getHours()-24);
		equal( akme.diffDays(date, now), 2, "should be 2 for -48 hours" );
	});

	
	module("akme extendClass and PRIVATES");
	test("private-scoped variables bound to each/this instance", function(){
		(function($,CLASS){

			var PRIVATES = {}; // closure guard

			function X(){
				var p = {x:1};
				this.PRIVATES = function(self) { return (self === PRIVATES) ? p : undefined; };
			}
			X.prototype = {get:get};
			$.setProperty($.THIS, CLASS, X);
			
			function get(key) {
				return this.PRIVATES(PRIVATES)[key];
			}

		})(akme,"my.X");
		
		var x = new my.X();
		equal(x.get("x"), 1, "x should be 1");
		
	});
	test("JS inheritance with akme.extendClass and PRIVATES", function() {
		(function($,CLASS){
			$.setProperty($.THIS, "my.Vehicle", function Vehicle(){});
			// function scope for a module
			var PRIVATES = {},
				DEFAULT_WHEELS = 4;

			function Car(privates) { 
			    // nested function scope for constructor
			    console.log(this.constructor.CLASS +".constructor() with wheels="+this.wheels);
			    var p = {x:1};
			    if (this.constructor !== Car && this instanceof Car) { // called by subclass
			    	if (privates) p = $.copyMissing(privates, p);
			    }
			    this.PRIVATES = function(self){ return self === PRIVATES ? p : undefined; };
			}
			$.extendClass(
				$.copyAll(Car, { // constructor function
					CLASS : CLASS, PRIVATES: PRIVATES // expose PRIVATES to allow subclass access
				}), 
				$.copyAll(new my.Vehicle(), { // super-static prototype
					wheels: DEFAULT_WHEELS,
					getX: function(){ return this.PRIVATES(PRIVATES).x; }
				}) 
			);
			$.setProperty($.THIS, CLASS, Car);
		})(akme,"my.Car");
		
		equal(typeof my.Car, "function", "my.Car should be a constructor function");
		ok(my.Car.prototype instanceof my.Vehicle, "my.Car.prototype should be instanceof my.Vehicle");
		ok(my.Car.constructor === my.Vehicle, "my.Car.constructor should be my.Vehicle, the super-constructor, aka this.constructor.constructor");
		var car = new my.Car();
		ok(car instanceof my.Car, "car should be instanceof my.Car");
		ok(car instanceof my.Vehicle, "car should be instanceof my.Vehicle");
		
		(function($,CLASS){
			var PRIVATES = my.Car.PRIVATES;
			function Mini() { 
			    // nested function scope for constructor
			    console.log(this.constructor.CLASS +".constructor() with wheels="+this.wheels);
			    var p = {y: 2};
			    this.constructor.constructor.call(this, p);
			}
			$.extendClass(
				$.copyAll(Mini, {CLASS : CLASS}), // constructor function
				$.copyAll(new my.Car(), { // super-static prototype
					getY: function(){ return this.PRIVATES(PRIVATES).y; }
				}) 
			);
			$.setProperty($.THIS, CLASS, Mini);
		})(akme,"my.Mini");
		var mini = new my.Mini();  
		equal( mini.getX(), 1, "x should be 1" );
		equal( mini.getY(), 2, "y should be 2" );
		equal(typeof mini.PRIVATES, "function", "x.PRIVATES should be function");
		equal(typeof mini.PRIVATES(), "undefined", "x.PRIVATES() should be undefined");
		equal(typeof mini.PRIVATES.call({}), "undefined", "x.PRIVATES({}) should be undefined");

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
		equal( typeof obj.map.akme, "undefined", "link to akme" );
		imap.copyFrom(ary, "cd");
		equal( imap.size(), 1, "imap size" );
		equal( typeof obj.map.akme, "object", "link to akme" );
		equal( obj.map.akme.name, "AKME Solutions", "link to akme name" );
	});

	module(akme.core.DataTable.CLASS);
 	test("basics and row defineProperties accessors", function() {
		var DataTable = akme.core.DataTable,
			dt = new DataTable();
		console.info("DataTable ", akme.formatJSON(dt));
		
		ok( typeof dt.forEach === "function", "forEach function exists" );
		ok( typeof dt.indexOf === "function", "indexOf function exists" );
		ok( typeof dt.keyMap === "object", "keyMap exists" );
		dt.head(["a","b","c"]);
		dt.key("a");
		dt.body([
		            [1,2,3],
		            [4,5,6],
		            [7,8,9]
		            ]);
		var meta = dt.meta();
		equal( meta.headLength, 3, "headLength 3" );
		equal( meta.bodyLength, 3, "bodyLength 3" );
		//equal( akme.formatJSON(dt), '{"key":["a"],"head":["a","b","c"],"body":[[1,2,3],[4,5,6],[7,8,9]]}', "toJSON OK" );
		equal( dt.toJSON(), '{"key":["a"],"head":["a","b","c"],"body":[[1,2,3],[4,5,6],[7,8,9]]}', "toJSON OK" );
		equal( dt.rowByKey(1)[1], 2, "row a=1 should have column 1(b)=2" );
		if (!akme.isIE8) {
			var byEvenOdd = dt.mapBy(function(row){ return row[0]%2; });
			equal( byEvenOdd["0"].length, 1, "even 0 should have length 1" );
			equal( byEvenOdd["1"].length, 2, "odd 1 should have length 2" );
			
			var rowProto = [];
			var propName = "x";
			Object.defineProperty(rowProto, propName, {
				get: function() { return this[0]+"z"; },
				set: function(v) { this[0] = v+"y"; }
			});
			var obj = Object.create(rowProto);
			obj.x = 1;
			equal( obj.x, "1yz", "obj.x should return 1yz" );
			equal( dt.rowByKey(1).b, 2, "row a=1 should have property b=2" );
		}
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
	test("AppContext", function(){
		var cx = new akme.core.AppContext(function(ev) {
			console.info("created ", ev.context);
		});
		ok( cx instanceof akme.core.AppContext, "instanceof akme.core.AppContext" );
		ok( cx instanceof akme.core.Context, "instanceof akme.core.Context" );
		cx.destroy();
	});

	module(akme.core.Promise.CLASS);
	test("basics", function() {
		var Promise = akme.core.Promise,
			GlobalPromise,
			promise, 
			executor = function (resolve,reject) {
				executor.resolve = resolve;
                executor.reject = reject;
			};
		if (typeof window !== "undefined") GlobalPromise = window.Promise;
		if (typeof global !== "undefined") GlobalPromise = global.Promise;
		expect(2 + (GlobalPromise ? 1 : 0));
		
		promise = new Promise(executor);
		ok( typeof Promise.resolve === "function", "Promise.resolve (class function) should be function" );
		ok( typeof promise.resolve === "undefined", "promise.resolve (instance function) should be undefined" );
		if (GlobalPromise) {
			ok( new Promise(executor) instanceof GlobalPromise, "new Promise should be instanceof GlobalPromise" );
		}
		
		// Note ES6 Promise resolves async on the next tick/pass of the JS event loop.
	});
	asyncTest("asyncPromise", function() {
		expect(2);
		var Promise = akme.core.Promise,
			promise, promise2,
			executor = function (resolve,reject) {
				executor.resolve = resolve;
                executor.reject = reject;
			};
	
		var executor2 = function (resolve,reject) {
                executor2.resolve = resolve;
                executor2.reject = reject;
			};
        promise = new Promise(executor);
        promise.then(function(result) {
            console.log("promise1", result);
			equal( result, 1, "promise1 should be 1" );
            var promise2 = new Promise(executor2);
            setTimeout(function(){ console.log("executor2.resolve(2)"); executor2.resolve(2); }, 25);
            console.log("return promise2", promise2);
            return promise2;
        }, function(error) {
            ok(false, "promise should fulfill");
        }).then(function(result) {
            console.log("promise2", result);
			equal( result, 2, "promise2 should be 2" );
			start();
        }, function (error) {
            ok(false, "promise2 should fulfill");
        });
        setTimeout(function(){ console.log("executor.resolve(1)"); executor.resolve(1); }, 25);

	});
	if (false) asyncTest("async", function() {
		expect(4);
		var promise;
		
		promise = akme.xhr.callPromise("GET", location.href);
		promise.then(always,always);
		function always(headers,content){
			ok( !(this instanceof XMLHttpRequest), "this is NOT an XMLHttpRequest" );
			ok( (this instanceof akme.core.Promise), "this is an "+akme.core.Promise );
			if (headers) {
				ok( headers.status === 200 && headers.statusText === "OK", "status is 200 OK" );
				ok( headers["Content-Type"] == "text/html", "Content-Type: text/html" );
			}
			start();
		}

	});
	
	module("akme dom");
	asyncTest("onContent", function() {
		expect(1);
		akme.onContent(function() {
			ok(true, "document ready");
            start();
		});
	});
	test("get/setAttributes on DOM Element", function(){
		var elem = akme.setAttributes(document.createElement("div"), {id:123});
		var map1 = {id:234};
		var map2 = akme.getAttributes(elem, map1);
		equal( map2.id, 123, "map.id == 123");
		equal( map2.id, map1.id, "map2.id == map1.id");
	});
	test("JSON", function(){
		equal( akme.parseJSON('{"a":1,"b":2,"c":3}').c, 3, "parseJSON should give c=3" );
		throws( function(){
			return akme.parseJSON('{"a":1,"b":2,"c":3').c;
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
	
	if (false) {
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
	
	
	module("jQuery DIV vs. Raphael SVG/VML");
	
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
	}
	$img2.click(goJQuery);
	setTimeout(function() { goJQuery(); }, 700);
	
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
	}
	img.click(goRaphael);
	setTimeout(function() { goRaphael(); }, 700);

	
	window.messageBroker = new akme.core.MessageBroker({id:"messageBroker", allowOrigins:[
	    "http://localhost", "https://localhost"
	]});
	akme.onEvent(window, "message", window.messageBroker);
	
	                                                                   	
	module("postMessage and MessageBroker");

	var iframe = akme.setAttributes(document.createElement("iframe"), {
		id:"selfOrigin", name:"selfOrigin", "class":"postMessage", frameborder:0, scrolling:"no",
		src:"index-frame.html"
	});
	for (var type in {"abort":1,"error":1,"load":1}) akme.onEvent(iframe, type, doPostMessage);
	document.body.appendChild(iframe);
	
	function doPostMessage(ev) {
		var iframe = ev.target;
		
		asyncTest("postMessage", function() {
			expect(1); // "http://www.yahoo.com/"
			var headers = {call: "XMLHttpRequest", method:"GET", url:"http://localhost/"};
			var content = null;
			window.messageBroker.callAsync(iframe, headers, content, function(headers, content){
				console.log(headers, content);
				ok(headers.status >= 200 && headers.status < 400, "status is OK or similar");
				start();
			});
		});
		
	}
	
});