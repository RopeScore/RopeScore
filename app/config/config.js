'use strict';
/**
 * @class jumpscore.config
 * @memberOf jumpscore
 * @requires ngRoute
 */
angular.module('jumpscore.config', ['ngRoute'])

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
   * @class jumpscore.config.ConfigCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ConfigCtrl', function($scope, $location, $routeParams, Db) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.setID($scope.id)
    if (!$scope.id) {
      $scope.id = btoa(new Date()
        .getTime())
    }

    $scope.save = function() {
      Db.set($scope.data)
      $location.path('/config/participants/' + $scope.id)
    }
  })
