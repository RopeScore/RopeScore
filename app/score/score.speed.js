'use strict';
/**
 * @class ropescore.score.speed
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.score.speed', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/speedscore/:id/:event', {
        templateUrl: '/score/score.speed.html',
        controller: 'SpeedScoreCtrl'
      });
    }
  ])

  /**
   * @class ropescore.score.SpeedScoreCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('SpeedScoreCtrl', function($scope, $location, $routeParams, Db,
    Abbr, Display, Calc, Num, Config) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.event = $routeParams.event;
    $scope.setID($scope.id)

    $scope.Abbr = Abbr
    $scope.getNumber = Num

    $scope.save = function() {
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }

    $scope.score = function(event, data, uid, ret) {
      return Calc.score(event, data, uid, $scope.id, ret, $scope)
    }

    $scope.display = function(uid, id, event) {
      Display.display(uid, id, event)
      $scope.data = Db.get()
    }

    $scope.displayAll = function(participants, id, event) {
      Display.displayAll(participants, id, event)
      $scope.data = Db.get()
    }
  })
