'use strict';
/**
 * @class ropescore.config
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.config', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/config/:id?', {
        templateUrl: '/config/config.html',
        controller: 'ConfigCtrl'
      });
    }
  ])

  /**
   * @class ropescore.config.ConfigCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ConfigCtrl', function($scope, $location, $routeParams, Db, Abbr,
    Config) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.setID($scope.id)
    if (!$scope.id) {
      $scope.id = btoa(new Date()
        .getTime())
      console.log(`new event with id: ${$scope.id}`)
    }

    $scope.save = function() {
      Db.set($scope.data)
      $location.path('/config/participants/' + $scope.id)
    }

    $scope.MissJudges = Config.MissJudges
    $scope.Simplified = Config.Simplified

    $scope.remove = function() {
      if (confirm(
          "Are you sure you want to remove this event and all of its data?"
        )) {
        console.log(`removing ${$scope.id}`)
        delete $scope.data[$scope.id]
        Db.set($scope.data)
        $location.path('/')
      }
    }

    $scope.Abbr = Abbr;
  })
