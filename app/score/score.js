/* global angular */
'use strict'
/**
 * @class ropescore.score
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.score', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/score/:id/:uid/:event', {
        templateUrl: '/score/score.html',
        controller: 'ScoreCtrl'
      })
    }
  ])

  /**
   * @class ropescore.score.ScoreCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ScoreCtrl', function ($scope, $location, $routeParams, Db, Abbr,
    Num, Config, Calc, Display) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id
    $scope.uid = $routeParams.uid
    $scope.event = $routeParams.event
    $scope.MissJudges = Config.MissJudges
    $scope.setID($scope.id)

    $scope.Abbr = Abbr
    $scope.getNumber = Num
    $scope.roundTo = Math.roundTo
    $scope.freestyle = Calc.freestyle

    $scope.score = function () {
      if (typeof $scope.data[$scope.id].scores === 'undefined' || typeof $scope.data[$scope.id].scores[$scope.uid] === 'undefined') {
        return undefined
      }
      return Calc.score($scope.event, $scope.data[$scope.id].scores[$scope.uid][$scope.event], $scope.uid)
    }

    $scope.display = function (uid, id, event) {
      Db.set($scope.data)
      Display.display(uid, id, event)
      $scope.data = Db.get()
    }

    $scope.toMax = function (j, i, t) {
      var el = document.getElementById((j) + (i) + (t))
      var val = Number(el.value.replace(',', '.'))
      var max = Number(el.max.replace(',', '.'))
      if (val > max) {
        $scope.data[$scope.id].scores[$scope.uid][$scope.event][j][i][t] =
          max
        el.classList.add('yellow')
        setTimeout(function () {
          el.classList.remove('yellow')
        }, 5000)
      }
    }

    $scope.save = function () {
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }
  })
