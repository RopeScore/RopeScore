'use strict';
/**
 * @class jumpscore.event
 * @memberOf jumpscore
 * @requires ngRoute
 */
angular.module('jumpscore.event', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/event/:id', {
        templateUrl: '/event/event.html',
        controller: 'EventCtrl'
      });
    }
  ])

  /**
   * @class jumpscore.event.EventCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('EventCtrl', function($scope, $location, $routeParams, Db, Abbr) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.setID($scope.id)
    $scope.Abbr = Abbr;
  })
