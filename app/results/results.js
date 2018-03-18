/* global angular, lsbridge */
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

    /**
     * recalculate results on backend message
     * @param  {Object} evt
     * @return {undefined}
     */
    lsbridge.subscribe('ropescore-updates', function (data) {
      if (data.type !== 'update') return
      console.log('Update ng')
      $scope.data = Db.get()
      updateScores()
      $scope.$apply()
    })

    $scope.id = $routeParams.id
    $scope.setID($scope.id)
    $scope.Abbr = Abbr
    $scope.getNumber = Num

    if ($scope.data[$scope.id].participants) {
      $scope.partArray = Object.keys($scope.data[$scope.id].participants)
        .map(function (key) {
          $scope.data[$scope.id].participants[key].uid = Number(key)
          return $scope.data[$scope.id].participants[key]
        })
    } else {
      $scope.partArray = []
    }

    $scope.showCol = function (grade, type, col) {
      if ($scope.data[$scope.id].config.simplified && typeof Config.SimplResultsCols[grade] !== 'undefined' && typeof Config.SimplResultsCols[grade][type] !== 'undefined' && typeof Config.SimplResultsCols[grade][type][col] !== 'undefined') {
        return Config.SimplResultsCols[grade][type][col]
      }
      return Config.ResultsCols[grade][type][col] || false
    }

    if ($scope.data[$scope.id].config.simplified) {
      $scope.enabledCols = Config.SimplResultsCols
    } else {
      $scope.enabledCols = Config.ResultsCols
    }

    $scope.colCount = function (event, overall) {
      var type = (Abbr.isSpeed(event) ? 'speed' : 'freestyle')
      var cat = (overall ? 'overall' : 'events')
      var raw = (overall === 2)
      var active = Object.keys($scope.enabledCols[cat][type]).filter(function (col) { return (raw && col !== 'rsum') || $scope.enabledCols[cat][type][col] })
      return active.length
    }

    /**
     * @param  {Object} obj  object with event as keys and enabled bool as property
     * @param  {Strin} type  dd, sr...
     * @return {Number}      number of Columns the header should span
     */
    $scope.header = function (obj, type, mode) {
      if (typeof obj === 'undefined' || typeof type === 'undefined') {
        console.warn('obj or type not fed to header function')
        return 0
      }
      var keys = Object.keys(obj)
      var sum = 0
      var i
      for (i = 0; i < keys.length; i++) {
        if (Abbr.isType(keys[i], type) && obj[keys[i]]) {
          sum += $scope.colCount(keys[i], mode)
        }
      }
      return sum
    }

    /**
     * Calculates per event ranks
     * @param  {Object} data  scores to rank
     * @param  {String} event event to rank
     * @return {Object}
     */
    $scope.rank = function (data, event) {
      if (Abbr.isSpeed(event)) {
        return Calc.rank.speed(data, event, $scope.data[$scope.id].config, $scope.rankAll, $scope.data[$scope.id].participants)
      } else if (!Abbr.isSpeed(event)) {
        return Calc.rank.freestyle(data, event, $scope.data[$scope.id].config, $scope.rankAll, $scope.data[$scope.id].participants)
      }
    }

    /**
     * Recalculates the results
     * @return {undefined}
     */
    var updateScores = function () {
      var i, j, event, obj
      $scope.ranks = {}
      $scope.overallRanks = {}
      $scope.finalscores = {}
      $scope.overallFinalscores = {}
      $scope.rankArray = []
      $scope.overallRankArray = []

      /* calculates for every participant */
      for (i = 0; i < $scope.partArray.length; i++) {
        var uid = $scope.partArray[i].uid

        /* init participants subobjects */
        if (typeof $scope.finalscores[uid] === 'undefined' && typeof $scope.data[$scope.id].scores !== 'undefined') {
          $scope.finalscores[uid] = {}
          if (Calc.inAll($scope.data[$scope.id].config.subevents, $scope.data[$scope.id].scores[uid])) {
            $scope.overallFinalscores[uid] = {}
          }
        }

        for (j = 0; j < Abbr.events().length; j++) {
          event = Abbr.events()[j]

          /* init the participants scoreobject */
          if (typeof $scope.finalscores[uid] !== 'undefined' && typeof $scope.finalscores[uid][event] === 'undefined') {
            $scope.finalscores[uid][event] = {}
            if (Calc.inAll($scope.data[$scope.id].config.subevents, $scope.data[$scope.id].scores[uid])) {
              $scope.overallFinalscores[uid][event] = {}
            }
          }

          /* calculate the participants score */
          if (typeof $scope.data[$scope.id].scores !== 'undefined' && typeof $scope.data[$scope.id].scores[uid] !== 'undefined' && typeof $scope.data[$scope.id].scores[uid][event] !== 'undefined') {
            $scope.finalscores[uid][event] = Calc.score(event, $scope.data[$scope.id].scores[uid][event], uid, $scope.data[$scope.id].config.simplified) || {}
            /** did not skip check */
            if (typeof $scope.data[$scope.id].scores[uid][event].dns !== 'undefined') {
              $scope.finalscores[uid][event].dns = $scope.data[$scope.id].scores[uid][event].dns
            }
            if (Calc.inAll($scope.data[$scope.id].config.subevents, $scope.data[$scope.id].scores[uid])) {
              $scope.overallFinalscores[uid][event] = $scope.finalscores[uid][event]
            }
          }
        }
      }

      /* rank every event */
      for (i = 0; i < Abbr.events().length; i++) {
        $scope.ranks[Abbr.events()[i]] = $scope.rank($scope.finalscores, Abbr.events()[i])
        $scope.overallRanks[Abbr.events()[i]] = $scope.rank($scope.overallFinalscores, Abbr.events()[i])
      }

      /* assemble array for orderBy with ranks and calculate final scores */
      for (i = 0; i < $scope.partArray.length; i++) {
        obj = {
          uid: $scope.partArray[i].uid
        }
        var overallObj = {
          uid: $scope.partArray[i].uid
        }
        for (j = 0; j < Abbr.events().length; j++) {
          event = Abbr.events()[j]
          if (Abbr.isSpeed(event) && typeof $scope.ranks[event][obj.uid] !== 'undefined') {
            obj[event] = $scope.ranks[event][obj.uid]
          } else if (typeof $scope.ranks[event][obj.uid] !== 'undefined') {
            obj[event] = $scope.ranks[event][obj.uid].total
          }

          if (Abbr.isSpeed(event) && typeof $scope.overallRanks[event][overallObj.uid] !== 'undefined') {
            overallObj[event] = $scope.overallRanks[event][overallObj.uid]
          } else if (typeof $scope.overallRanks[event][obj.uid] !== 'undefined') {
            overallObj[event] = $scope.overallRanks[event][overallObj.uid].total
          }
        }
        $scope.rankArray.push(obj)
        if (typeof $scope.data[$scope.id].scores !== 'undefined' && Calc.inAll($scope.data[$scope.id].config.subevents, $scope.data[$scope.id].scores[overallObj.uid])) {
          $scope.overallRankArray.push(overallObj)
        }

        uid = $scope.partArray[i].uid
        event = 'final'

        if (typeof $scope.finalscores[uid] === 'undefined') {
          continue
        }
        $scope.finalscores[uid][event] = Calc.finalscore($scope.finalscores[uid], $scope.data[$scope.id].config.subevents, $scope.rankAll, uid)
        if (Calc.inAll($scope.data[$scope.id].config.subevents, $scope.data[$scope.id].scores[uid])) {
          $scope.overallFinalscores[uid][event] = $scope.finalscores[uid][event]
        }
      }

      $scope.ranksums = Calc.rank.sum($scope.rankArray, $scope.finalscores, $scope.data[$scope.id].config.subevents, $scope.data[$scope.id].config.simplified)
      $scope.finalRanks = Calc.rank.overall($scope.ranksums, $scope.finalscores)

      $scope.overallRanksums = Calc.rank.sum($scope.overallRankArray, $scope.overallFinalscores, $scope.data[$scope.id].config.subevents, $scope.data[$scope.id].config.simplified)
      $scope.overallFinalRanks = Calc.rank.overall($scope.overallRanksums, $scope.overallFinalscores)

      for (i = 0; i < $scope.partArray.length; i++) {
        $scope.partArray[i].rank = $scope.finalRanks[$scope.partArray[i].uid] || undefined
        $scope.partArray[i].overallRank = $scope.overallFinalRanks[$scope.partArray[i].uid] || undefined
      }
    }

    updateScores()

    $scope.roundTo = Math.roundTo
    $scope.inAll = Calc.inAll

    $scope.toMinScore = function (score) {
      return ($scope.data[$scope.id].config.simplified && typeof Config.SimplMinScore !== 'undefined' && score < Config.SimplMinScore ? Config.SimplMinScore : score)
    }

    $scope.ShowDC = Config.ShowDC
    $scope.ShowAllTables = Config.ShowAllTables

    /**
     * toggles rankAll and updates the results
     * @param  {Boolean} forceOff if true, it'll forcefully turn it off instead of toggling
     * @return {undefined}
     */
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

    /**
     * Converts and exports all tables to excel
     * @return {undefined}
     */
    $scope.toExcel = function () {
      $scope.toggleRankAll(true)
      setTimeout(function () {
        var tables = document.getElementsByTagName('table')
        tables = Array.prototype.slice.call(tables)
        tables.shift()
        tablesToExcel(tables, $scope.data[$scope.id].config.name)
      })
    }
  })
