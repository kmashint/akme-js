// akme-angular.js
angular.module("akme", [])
.constant("FRAME_ORIGIN_MAP", {})
.config(['$provide',function($provide){

	$provide.decorator('$httpBackend', ['$delegate','$browser','FRAME_ORIGIN_MAP',$HttpBackendBrokerDecorator]);
	function $HttpBackendBrokerDecorator($delegate,$browser,FRAME_ORIGIN_MAP) {
		return $httpBackendBroker;
		
		function $httpBackendBroker(method, url, post, callback, headers, timeout, withCredentials) {
		    url = url || $browser.url();
		    var urlOrigin = url.substring(0, url.indexOf('/',8));
		    var originMap = FRAME_ORIGIN_MAP;
		    var frameName;
		    if (method!="jsonp" && urlOrigin == location.href.substring(0, location.href.indexOf('/',8))) {
			    for (var key in originMap) if (originMap[key].test(urlOrigin)) { frameName = key; break; }; 
		    }
			if (!frameName) {
				// Defer to the original $httpBackend if calling the same origin or jsonp.
				$delegate(method, url, post, callback, headers, timeout, withCredentials);
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

		      callback(status, response, headersString);
		      $browser.$$completeOutstandingRequest(noop);
		    }
		};
	}

}]);