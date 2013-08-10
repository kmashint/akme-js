// akme-angular.js
angular.module("akme",[]).config(['$provide',function($provide){

	var URL_MATCH = /^([^:]+):\/\/(\w+:{0,1}\w*@)?(\{?[\w\.-]*\}?)(:([0-9]+))?(\/[^\?#]*)?(\?([^#]*))?(#(.*))?$/;

	$provide.decorator('$httpBackend', $HttpBackendBrokerDecorator);
	
	function $HttpBackendBrokerDecorator($delegate) {
		
		// How to obtain the relevant MessageBroker?
		// Allow a MessageBroker to use a default frameName for it to find the frames[frameName] itself?
		// The MessageBroker should be a config of the HttpBackendProvider?
		// Shuffle callAsync arguments to (headers, content, callback) if first arg not Element.
		//
		return $httpBackendBroker;
		function $httpBackendBroker(method, url, post, callback, headers, timeout, withCredentials) {
		    url = url || $browser.url();
			if (method=="jsonp" || 
					(url.substring(0, url.indexOf('/',8)) == location.href.substring(0, location.href.indexOf('/',8)))) {
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
		      // URL_MATCH is defined in src/service/location.js
		      var protocol = (url.match(URL_MATCH) || ['', locationProtocol])[1];

		      // fix status code for file protocol (it's always 0)
		      status = (protocol == 'file') ? (response ? 200 : 404) : status;

		      // normalize IE bug (http://bugs.jquery.com/ticket/1450)
		      status = status == 1223 ? 204 : status;

		      callback(status, response, headersString);
		      $browser.$$completeOutstandingRequest(noop);
		    }
		};
	}

}]);