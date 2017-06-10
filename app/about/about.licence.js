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
      if (Config.Eval) {
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
  .controller('LicenceCtrl', function($scope, Config) {
    $scope.name = "Mr. Takashi Ogawa";
    $scope.from = Config.LicenceDate;
    $scope.to = Number(Config.LicenceDate) + (30 * 24 * 60 * 60 * 1000);
  })
