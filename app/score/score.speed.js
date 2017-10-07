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

    $scope.score = function (event, data, uid, ret) {
      return Calc.score(event, data, uid, $scope.id, ret, $scope)
    }

    $scope.display = function (uid, id, event) {
      Db.set($scope.data)
      Display.display(uid, id, event)
      $scope.data = Db.get()
    }

    $scope.clean = function (obj) {
      var scope = obj
      var keys = Object.keys(scope)

      for (var i = 0; i < keys.length; i++) {
        if (scope[keys[i]] !== null && typeof scope[keys[i]] === 'object') {
          scope[keys[i]] = $scope.clean(scope[keys[i]])
        }
        if (scope[keys[i]] === null || scope[keys[i]] === '' || typeof scope[keys[i]] === 'undefined' || (typeof scope[keys[i]] === 'object' && Object.keys(scope[keys[i]]).length === 0) || (typeof scope[keys[i]] === 'boolean' && scope[keys[i]] === false)) {
          delete scope[keys[i]]
        }
      }
      return scope
    }

    $scope.dnsSave = function (uid, id, event) {
      $scope.data[id].scores[uid][event] = {dns: true}
      $scope.data[$scope.id].scores = $scope.clean($scope.data[$scope.id].scores)
      if ($scope.data[$scope.id].scores !== null && typeof $scope.data[$scope.id].scores === 'object' && Object.keys($scope.data[$scope.id].scores).length === 0) {
        delete $scope.data[$scope.id].scores
      }
      Db.set($scope.data)
    }

    $scope.reskipAllowed = function (uid, id, event) {
      if (typeof $scope.data[id].scores === 'undefined' || typeof $scope.data[id].scores[uid] === 'undefined' || typeof $scope.data[id].scores[uid][event] === 'undefined' || typeof $scope.data[id].scores[uid][event].s === 'undefined') {
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

    $scope.save = function () {
      $scope.data[$scope.id].scores = $scope.clean($scope.data[$scope.id].scores)
      if ($scope.data[$scope.id].scores !== null && typeof $scope.data[$scope.id].scores === 'object' && Object.keys($scope.data[$scope.id].scores).length === 0) {
        delete $scope.data[$scope.id].scores
      }
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }
  })
