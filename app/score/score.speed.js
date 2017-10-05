/* global angular */
'use strict'
/**
 * @class ropescore.score.speed
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.score.speed', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/speedscore/:id/:event', {
        templateUrl: '/score/score.speed.html',
        controller: 'SpeedScoreCtrl'
      })
    }
  ])

  /**
   * @class ropescore.score.SpeedScoreCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('SpeedScoreCtrl', function ($scope, $location, $routeParams, Db,
    Abbr, Display, Calc, Num, Config) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id
    $scope.event = $routeParams.event
    $scope.setID($scope.id)

    $scope.Abbr = Abbr
    $scope.getNumber = Num

    $scope.save = function () {
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }

    $scope.score = function (event, data, uid, ret) {
      return Calc.score(event, data, uid, $scope.id, ret, $scope)
    }

    $scope.display = function (uid, id, event) {
      Db.set($scope.data)
      Display.display(uid, id, event)
      $scope.data = Db.get()
    }

    $scope.reskipAllowed = function (uid, id, event) {
      if (typeof $scope.data[id].scores === 'undefined' || typeof $scope.data[id].scores[uid] === 'undefined') {
        return undefined
      }
      var scores = Object.keys($scope.data[id].scores[uid][event].s).map(function (el) {
        return $scope.data[id].scores[uid][event].s[el]
      })
      var bools = []
      scores.sort(function (a, b) {
        return a - b
      })
      for (var i = 0; i < scores.length - 1; i++) {
        bools.push(scores[i + 1] - scores[i] > 3)
      }
      if (bools.length <= 0) {
        return false
      }
      var bool = bools.reduce(function (a, b) {
        return b && a
      })
      $scope.data[id].scores[uid][event].reskip = bool
      return bool
    }

    $scope.displayAll = function (participants, id, event) {
      Db.set($scope.data)
      Display.displayAll(participants, id, event)
      $scope.data = Db.get()
    }
  })
