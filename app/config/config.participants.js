'use strict';
/**
 * @class jumpscore.config.participants
 * @memberOf jumpscore
 * @requires ngRoute
 */
angular.module('jumpscore.config.participants', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/config/participants/:id', {
        templateUrl: '/config/config.participants.html',
        controller: 'ParticipantsCtrl'
      });
    }
  ])

  /**
   * @class jumpscore.config.participants.ParticipantsCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ParticipantsCtrl', function($scope, $location, $routeParams, Db,
    Num) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.setID($scope.id)

    $scope.data[$scope.id].config.idStart = $scope.data[$scope.id].config.idStart ||
      100;

    $scope.getNumber = Num

    $scope.save = function() {
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }
  })
