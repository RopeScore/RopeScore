/* global angular */
'use strict'
/**
 * @class ropescore.results
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.results', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/results/:id', {
        templateUrl: '/results/results.html',
        controller: 'ResultsCtrl'
      })
    }
  ])

  /**
   * @class ropescore.results.ResultsCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ResultsCtrl', function ($scope, $location,
    $routeParams, $interval, Db, Calc, Abbr, Num, Config, tablesToExcel) {
    $scope.data = Db.get()
    // dbSocket.onmessage = function(evt) {
    //   var data = JSON.parse(evt.data)
    //   if (data.type != 'update') return;
    //   console.log('Update ng')
    //   $scope.data = Db.get()
    //   $scope.$apply();
    // }
    $scope.live = function (forceOff) {
      if (forceOff || $scope.isLive) {
        $scope.isLive = false
        $interval.cancel($scope.interval)
        if (typeof console.__log === 'function') {
          console.log = console.__log
        }
        console.log('live update stopped')
      } else {
        console.log('updating live')
        $scope.isLive = true
        console.__log = console.log
        console.log = function () {}
        $scope.interval = $interval(function () {
          $scope.data = Db.get()
          updateScores()
        }, 5000)
      }
    }

    $scope.id = $routeParams.id
    $scope.setID($scope.id)
    $scope.Abbr = Abbr
    $scope.getNumber = Num

    if ($scope.data[$scope.id].participants) {
      $scope.partArray = Object.keys($scope.data[$scope.id].participants)
        .map(function (key) {
          $scope.data[$scope.id].participants[key].uid = key
          return $scope.data[$scope.id].participants[key]
        })
    } else {
      $scope.partArray = []
    }

    $scope.rank = function (data, event) {
      if (Abbr.isSpeed(event)) {
        return Calc.rank.speed(data, event, $scope.data[$scope.id].config, $scope.rankAll, $scope.data[$scope.id].participants)
      } else if (!Abbr.isSpeed(event)) {
        return Calc.rank.freestyle(data, event, $scope.data[$scope.id].config, $scope.rankAll, $scope.data[$scope.id].participants)
      }
    }

    var updateScores = function () {
      var i, j, event
      $scope.ranks = {}
      $scope.finalscores = {}
      $scope.rankArray = []

      for (i = 0; i < $scope.partArray.length; i++) {
        var uid = $scope.partArray[i].uid

        if (typeof $scope.finalscores[uid] === 'undefined') {
          $scope.finalscores[uid] = {}
        }

        for (j = 0; j < Abbr.events.length; j++) {
          event = Abbr.events[j]

          if (typeof $scope.finalscores[uid][event] === 'undefined') {
            $scope.finalscores[uid][event] = {}
          }
          if (typeof $scope.data[$scope.id].scores[uid] !== 'undefined') {
            $scope.finalscores[uid][event] = Calc.score(event, $scope.data[$scope.id].scores[uid][event], uid, $scope.data[$scope.id].config.simplified)
          }
        }
      }

      for (i = 0; i < Abbr.events.length; i++) {
        $scope.ranks[Abbr.events[i]] = $scope.rank($scope.finalscores, Abbr.events[i])
      }

      for (i = 0; i < $scope.partArray.length; i++) {
        var obj = {
          uid: $scope.partArray[i].uid
        }
        for (j = 0; j < Abbr.events.length; j++) {
          event = Abbr.events[j]
          if (Abbr.isSpeed(event)) {
            obj[event] = $scope.ranks[event][obj.uid]
          } else if (typeof $scope.ranks[event][obj.uid] !== 'undefined') {
            obj[event] = $scope.ranks[event][obj.uid].total
          }
        }
        $scope.rankArray.push(obj)
      }

      for (i = 0; i < $scope.partArray.length; i++) {
        uid = $scope.partArray[i].uid
        event = 'final'

        if (typeof $scope.finalscores[uid] === 'undefined') {
          continue
        }
        $scope.finalscores[uid][event] = Calc.finalscore($scope.finalscores[uid], $scope.data[$scope.id].config.subevents, $scope.rankAll, uid)
      }
      console.log($scope.data[$scope.id].config.subevents)
      $scope.ranksums = Calc.rank.sum($scope.rankArray, $scope.finalscores, $scope.data[$scope.id].config.subevents)
      $scope.finalRanks = Calc.rank.overall($scope.ranksums)

      for (i = 0; i < $scope.partArray.length; i++) {
        $scope.partArray[i].rank = $scope.finalRanks[$scope.partArray[i].uid] || undefined
      }
    }

    updateScores()

    $scope.roundTo = Math.roundTo
    $scope.inAll = Calc.inAll

    $scope.ShowDC = Config.ShowDC
    $scope.ShowAllTables = Config.ShowAllTables

    $scope.toggleRankAll = function (forceOff) {
      if (forceOff || $scope.rankAll === true) {
        var keys = Object.keys($scope.data[$scope.id].participants)
        for (var i = 0; i < keys.length; i++) {
          delete $scope.data[$scope.id].participants[keys[i]].rank
        }
        $scope.rankAll = false
        updateScores()
      } else {
        $scope.rankAll = true
        updateScores()
      }
    }

    $scope.toExcel = function () {
      $scope.live(true)
      $scope.toggleRankAll(true)
      setTimeout(function () {
        var tables = document.getElementsByTagName('table')
        tables = Array.prototype.slice.call(tables)
        tables.shift()
        tablesToExcel(tables, $scope.data[$scope.id].config.name)
      })
    }
  })
