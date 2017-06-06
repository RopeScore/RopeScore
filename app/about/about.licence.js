'use strict';
/**
 * @class ropescore.about.licence
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.about.licence', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      var evaluation = true;
      if (evaluation) {
        $routeProvider.when('/licence', {
          templateUrl: '/about/about.licence.eval.html',
          controller: 'LicenceCtrl'
        });
      } else {
        $routeProvider.when('/licence', {
          templateUrl: '/about/about.licence.html',
          controller: 'LicenceCtrl'
        });
      }
    }
  ])

  /**
   * @class ropescore.about.licence.LicenceCtrl
   */
  .controller('LicenceCtrl', function($scope) {
    $scope.name = "Mr. Takashi Ogawa";
    $scope.from = "May 16, 2017"
    $scope.to = "June 16, 2017"
  })
