// angular-test.js
//

// http://glennstovall.com/blog/2013/06/27/angularjs-an-overview/
// http://thoughts.mindofmoses.com/read/angularjs-example-learn-to-think-model-first-dom-second

/**
 * Angular begins with defining application modules and their components.
 * 	angular.module().config().constant().controller().directive().factory().filter().provider().run().service().value()
 * 
 * .module("main") will return that module instance if it already exists, otherwise throws Error.
 * .module().config(fn) will register to be called on module loading/registering (early).
 * .module().run(fn) will register to be called when the injector is done loading all modules/dependencies (late).
 * 
 * For UI, it's best to disable Angular's wasteful auto-bootstrap and just do it in one line.
 * The example below assumes one "main" module.
 * 	angular.element(document).ready(function(){ angular.bootstrap(document.body,["main"]); });
 * 
 * Angular JS has $q similar to but not exactly like a jQuery $.Deferred/promise.
 * qFactory, which provides $q, has defer(), reject(reasonArg), when(value,done,fail), all(promises) 
 * where all() is really like jQuery when().
 * 
 */

angular.module("main", []).config(["$locationProvider", "$rootScopeProvider", function($locationP,$rootP){
	// .module(name, depends, configFn) configures or gets a module by name.
	
	$locationP.html5Mode(true);
	
}]).run(["$rootScope", function($scope){
	// .run() can be used to access the root scope after module construction/configuration.

	console.log("main $rootScope ", $scope)

	$scope.users = ["harry","sally"];
	
}]).controller("MainCtrl", ["$scope", function MainCtrl($scope){
	// .controller defines a nested scope within the root to localise changes.
	
}]);

angular.module("sync", []).run(["$rootScope", function($scope){
	console.log("sync $rootScope ", $scope)
}]);

angular.element(document).ready(function(){
	console.logEnabled = true;

	angular.bootstrap(document.body);
	console.log( angular.module("x") );

	test("angular basics", function(){
		ok( typeof angular === "object", "angular exists" );
		for (var key in angular) console.log("angular."+key);
	});

});