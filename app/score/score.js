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
    Num, Config, Calc, Display) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.uid = $routeParams.uid;
    $scope.event = $routeParams.event;
    $scope.MissJudges = Config.MissJudges;
    $scope.setID($scope.id)

    $scope.Abbr = Abbr
    $scope.getNumber = Num
    $scope.roundTo = Math.roundTo

    $scope.display = function(uid, id, event) {
      Display.display(uid, id, event)
      $scope.data = Db.get()
    }

    $scope.score = function(event, data, uid, ret) {
      return Calc.score(event, data, uid, $scope.id, ret, $scope)
    }

    $scope.save = function() {
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }
  })
