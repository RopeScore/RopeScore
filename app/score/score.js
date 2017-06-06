'use strict';
/**
 * @class ropescore.score
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.score', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/score/:id/:uid/:event', {
        templateUrl: '/score/score.html',
        controller: 'ScoreCtrl'
      });
    }
  ])

  /**
   * @class ropescore.score.ScoreCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ScoreCtrl', function($scope, $location, $routeParams, Db, Abbr,
    Num) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.uid = $routeParams.uid;
    $scope.event = $routeParams.event;
    $scope.setID($scope.id)

    $scope.Abbr = Abbr
    $scope.getNumber = Num

    $scope.save = function() {
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }
  })
