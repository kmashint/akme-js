// akme-angular.js
angular.module("akme", [])
.constant("frameOriginMap", {})
.config(['$provide',function($provide){

	$provide.decorator('$httpBackend', ['$delegate','$browser','frameOriginMap',$HttpBackendBrokerDecorator]);
	function $HttpBackendBrokerDecorator($delegate,$browser,$scope,frameOriginMap) {
		return $httpBackendBroker;
		
		function $httpBackendBroker(method, url, post, callback, headers, timeout, withCredentials) {
		    url = url || $browser.url();
		    var urlOrigin = url.substring(0, url.indexOf('/',8));
		    // TODO: Now lookup the urlOrigin using a list of RegExp to a frame name ?
		    // That would be part of the constant configuration? or $rootScope?
		    var originMap = frameOriginMap;
		    var frameName;
		    for (var key in originMap) if (originMap[key].test(urlOrigin)) { frameName = key; break; }; 
			if (method=="jsonp" || 
					(urlOrigin == location.href.substring(0, location.href.indexOf('/',8))) ||
					!frameName) {
				// Defer to the original $httpBackend if calling the same origin or jsonp.
				$delegate(method, url, post, callback, headers, timeout, withCredentials);
				return;
			}
		    $browser.$$incOutstandingRequestCount();
		    
	  		var brokerHeaders = akme.copyAll({method: method, url: url}, headers);
		    var status;

	  		// How to obtain the relevant MessageBroker ?
	  		// Assume window.messageBroker?
	  		// How to define frame?
	  		// MessageBroker.callAsync : function(frame, headers, content, callbackFnOrOb) 
	  		window.messageBroker.callAsync(document.frames[0],
	  				brokerHeaders,
	  				post || '',
	  				function(headers, content) {
	  			var headersAry = []; 
	  			for (var key in headers) headersAry[headersAry.length] = key +": "+ headers[key];
	  			completeRequest(callback, status || headers.status, content, headersAry.join('\n'));
	  		});

		    function completeRequest(callback, status, response, headersString) {
		      // find the protocol of the given url or, if relative, the current location
		      var protocol = url.substring(0, url.lastIndexOf(':',8)+1) || location.protocol;

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