'use strict';
/**
 * @class ropescore.about.docs
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.about.docs', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/docs', {
        templateUrl: '/about/about.docs.html',
        controller: 'DocsCtrl'
      });
    }
  ])

  /**
   * @class ropescore.about.docs.DocsCtrl
   */
  .controller('DocsCtrl', function($scope) {})
