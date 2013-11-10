// akme-angular.js
angular.module("akme", ["ng"])
//.value("FRAME_ORIGIN_MAP", {})
.config(['$provide','$httpProvider','$httpBackendProvider',function($provide,$httpProvider,$httpBackendProvider){

	// Support $q promise.always(function(result,reason){...}) where result only available on resolve, reason only on reject.
	$provide.decorator('$q', ['$delegate', function($delegate) { 
		var defer = $delegate.defer;
		$delegate.defer = function() { var d = defer(); enhancePromise(d.promise); return d; };
		var reject = $delegate.reject;
		$delegate.reject = function(reason) { return enhancePromise(reject(reason)); };
		var when = $delegate.when;
		$delegate.when = function(value, callback, errback) { return enhancePromise(when(value, callback, errback)); };
		var all = $delegate.all;
		$delegate.all = function(promises) { return enhancePromise(all(promises)); };
		
		function enhancePromise(p) {
			p.always = function(always) {
				return p.then(always, function(reason){ always(null,reason); });
			};
			if (Number(angular.version.major +"."+ angular.version.minor) < 1.2) {
				// If not yet 1.2, add features of Angular 1.2.
				p["catch"] = catchCall;
				p["finally"] = finallyCall;
			}
			return p;
		}
	  
	  // Below is a back-port from 1.2 of $q promise.catch and promise.finally.
	  function defaultCallback(value) {
		  return value;
	  }
	  function defaultErrback(reason) {
		  return $delegate.reject(reason);
	  }
	  function catchCall(callback) {
          return this.then(null, callback);
      }
	  function finallyCall(callback) {

          function makePromise(value, resolved) {
            var result = $delegate.defer();
            if (resolved) {
              result.resolve(value);
            } else {
              result.reject(value);
            }
            return result.promise;
          }

          function handleCallback(value, isResolved) {
            var callbackOutput = null;
            try {
              callbackOutput = (callback ||defaultCallback)();
            } catch(e) {
              return makePromise(e, false);
            }
            if (callbackOutput && angular.isFunction(callbackOutput.then)) {
              return callbackOutput.then(function() {
                return makePromise(value, isResolved);
              }, function(error) {
                return makePromise(error, false);
              });
            } else {
              return makePromise(value, isResolved);
            }
          }

          return this.then(function(value) {
            return handleCallback(value, true);
          }, function(error) {
            return handleCallback(error, false);
          });
	  }
	  
	  return $delegate;
	}]);

	
	// Decorate the default backend.
	$provide.decorator('$httpBackend', ['$delegate','$browser','FRAME_ORIGIN_MAP',$HttpBackendBrokerDecorator]);

	// Create and decorate a new front-end, avoiding the re-creation error of the $cacheFactory('$http') cache.
	var $httpLoadingProvider = akme.clone($httpProvider);
	var old$get = $httpLoadingProvider.$get[$httpLoadingProvider.$get.length-1];
	$httpLoadingProvider.$get = ['$httpLoadingBackend', '$browser', '$cacheFactory', '$rootScope', '$q', '$injector',
	    function($httpBackend, $browser, $cacheFactory, $rootScope, $q, $injector) {
			return old$get($httpBackend, $browser, myCacheFactory, $rootScope, $q, $injector);
			function myCacheFactory(cacheId, options) { return $cacheFactory.get(cacheId) || $cacheFactory(cacheId, options); };
	}];
	$provide.provider('$httpLoading', $httpLoadingProvider);
	$provide.provider('$httpLoadingBackend', akme.clone($httpBackendProvider));
	$provide.decorator('$httpLoadingBackend', ['$delegate','$browser','FRAME_ORIGIN_MAP','loadingWidget',$HttpBackendBrokerDecorator]);

	function $HttpBackendBrokerDecorator($delegate,$browser,FRAME_ORIGIN_MAP,loadingWidget) {
		return $httpBackendBroker;
		function $httpBackendBroker(method, url, post, callback, headers, timeout, withCredentials) {
			
		    url = url || $browser.url();
		    var urlOrigin = (url.charAt(0) == "/") ?
					location.protocol + "//" + location.host :
					url.substring(0, url.indexOf('/',8));
		    var locationOrigin = location.href.substring(0, location.href.indexOf('/',8));
		    var originMap = FRAME_ORIGIN_MAP;
		    var frameName;
		    if (method!="jsonp" && urlOrigin != locationOrigin) {
			    for (var key in originMap) if (originMap[key].test(urlOrigin)) { frameName = key; break; }; 
		    }
		    
		    // add language header if it's not there
		    if (!headers["Accept-Language"]) {
		    	headers["Accept-Language"] = akme.getContext().get("lang") || "en";
		    }
		    
		    // if (console.logEnabled) console.log("FRAME_ORIGIN_MAP ", FRAME_ORIGIN_MAP, " frameName ", frameName, " urlOrigin ", urlOrigin, " locationOrigin ", locationOrigin);
			if (!frameName) {
				// Defer to the original $httpBackend if calling the same origin or jsonp.
				$delegate(method, url, post, 
						function(status, response, headersString){completeResponse(callback, status, response, headersString);}, 
						headers, timeout, withCredentials);
				if (loadingWidget) setTimeout(loadingWidget.show(), 200);
				return;
			}
			
		    $browser.$$incOutstandingRequestCount();

	  		var brokerHeaders = akme.copyAll({call: "XMLHttpRequest", method: method, url: url}, headers);
		    var status;

		    var frame = document.getElementsByName(frameName)[0]; // getElementById(frameName); 
	  		var callbackKey = window.messageBroker.callAsync(frame,
	  				brokerHeaders,
	  				post || '',
	  				function(headers, content) {
	  			var headersAry = []; 
	  			for (var key in headers) headersAry[headersAry.length] = key +": "+ headers[key];
	  			completeRequest(callback, status || headers.status, content, headersAry.join('\n'));
	  		});
	        if (timeout > 0) {
	        	$browser.defer(function() {
	            	status = -1;
	            	window.messageBroker.deleteCallbackKey(callbackKey); //xhr.abort();
	            	completeRequest(callback, status);
	            }, timeout);
	        }
	        
		    function completeRequest(callback, status, response, headersString) {
		      // find the protocol of the given url or, if relative, the current location
		      var protocol = url.substring(0, url.lastIndexOf(':',5)+1) || location.protocol;

		      // fix status code for file protocol (it's always 0)
		      status = (protocol == 'file:') ? (response ? 200 : 404) : status;

		      // normalize IE bug (http://bugs.jquery.com/ticket/1450)
		      status = status == 1223 ? 204 : status;
		      
		      completeResponse(callback, status, response, headersString);
		    }
		    
	        function completeResponse(callback, status, response, headersString) {
	        	if (loadingWidget) setTimeout(loadingWidget.hide(), 200);
		    	callback(status, response, headersString);
			    $browser.$$completeOutstandingRequest(angular.noop);
	        }
		};
	}

}])
/**
 *  Wrap akme.core.CouchAsyncAccess for use with Angular.
 *  
 	// Sample Access implementation to inject/construct with specific (name, url) arguments.
	angular.module(["akme"]).factory("myCouch", ["CouchAsyncAccess", function(self){
		self.constructor("shiftdb", "http://localhost:5984/shiftdb");
		return self;
	}]);
 */
.factory('CouchAsyncAccess', ["$q", "$rootScope", function($q, $rootScope){ // akme.extend(akme.core.CouchAsyncAccess, 
	// DO NOT CALL SUPER as a factory, only as a service ... this.constructor.constructor.call(this, name, url); // super();
	// This really should be a Provider to delay the constructor function to the $get where it can use configured arguments.
	var proto = akme.core.CouchAsyncAccess.prototype;
	var self = Object.create(proto);
	function isSuccess(headers) { return headers.status >= 200 && headers.status < 400; };
	function promise() {
		var key = arguments[arguments.length-1],
			deferred = $q.defer(),
			promise = deferred.promise;
		arguments[arguments.length-1] = function(result,headers) {
			if (isSuccess(headers)) deferred.resolve(result);
			else deferred.reject(headers);
			$rootScope.$apply();
		};
		proto[key].apply(self, arguments);
		return promise;
	}
	/*
	info : info, // given id return Object of HEAD info
	copy : copy, // given key,newKey return Object
	read : read, // given id return Object
	readMany : $.core.AccessUtil.readMany, // given Object or Array of ids return Object or Array
	write : write, // given Object return Object
	remove : remove // given Object return Object
	*/
	self.info = function(key) { return promise(key, "info"); };
	self.copy = function(key, newKey) { return promise(key, newKey, "copy"); };
	self.read = function(key) { return promise(key, "read"); };
	self.write = function(key, val) { return promise(key, val, "write"); };
	self.remove = function(key, rev) { return promise(key, rev, "remove"); };
	return self;
}]);
