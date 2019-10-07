/* global angular, lsbridge, confirm, performance */
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
      $routeProvider.when('/results/:ids?', {
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
    $routeParams, $interval, Db, Calc, Abbr, Num, Config, Cleaner, tablesToExcel) {
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

    $scope.ids = $routeParams.ids
    if (typeof $scope.ids !== 'undefined') {
      $scope.categories = $scope.ids.split('.')
      $scope.setID(($scope.categories.length === 1 ? $scope.categories[0] : null))
      if ($scope.categories.length > 1) $scope.group = $scope.data[$scope.categories[0]].config.group
    } else {
      $scope.setID(null)
      $scope.categories = Object.keys($scope.data).filter(function (key) { return key !== 'globconfig' })
    }
    $scope.Abbr = Abbr
    $scope.getNumber = Num
    $scope.printPreview = false

    $scope.showCol = function (id, grade, type, col) {
      if ($scope.data[id].config.simplified && typeof Config.SimplResultsCols[grade] !== 'undefined' && typeof Config.SimplResultsCols[grade][type] !== 'undefined' && typeof Config.SimplResultsCols[grade][type][col] !== 'undefined') {
        return Config.SimplResultsCols[grade][type][col]
      }
      return Config.ResultsCols[grade][type][col] || false
    }

    for (let id of $scope.categories) {
      if (typeof $scope.enabledCols === 'undefined') $scope.enabledCols = {}
      if ($scope.data[id].config.simplified) {
        $scope.enabledCols[id] = Config.SimplResultsCols || Config.ResultsCols
      } else {
        $scope.enabledCols[id] = Config.ResultsCols
      }
    }

    $scope.colCount = function (id, event, overall) {
      var type = (Abbr.isSpeed(event) ? 'speed' : 'freestyle')
      var cat = (overall ? 'overall' : 'events')
      var raw = (overall === 2)
      var active = Object.keys($scope.enabledCols[id][cat][type]).filter(function (col) { return (raw && col !== 'rsum') || $scope.enabledCols[id][cat][type][col]})
      return active.length
    }

    /**
     * @param  {Object} obj  object with event as keys and enabled bool as property
     * @param  {Strin} type  dd, sr...
     * @return {Number}      number of Columns the header should span
     */
    $scope.header = function (id, obj, type, mode) {
      if (typeof obj === 'undefined' || typeof type === 'undefined') {
        console.warn('obj or type not fed to header function')
        return 0
      }
      var keys = Object.keys(obj)
      var sum = 0
      var i
      for (i = 0; i < keys.length; i++) {
        if (Abbr.isType(keys[i], type) && obj[keys[i]]) {
          sum += $scope.colCount(id, keys[i], mode)
        }
      }
      return sum
    }

    /**
     * Recalculates the results
     * @return {undefined}
     */
    var updateScores = function () {
      let start = performance.now()
      if (typeof $scope.results === 'undefined') $scope.results = {}
      for (let id of $scope.categories) {
        $scope.results[id] = Calc.results($scope.data[id], $scope.rankAll)
      }
      let end = performance.now()
      console.log('Results calculation for categories took', Math.roundTo(end - start, 2), 'milliseconds.')
    }

    updateScores()

    $scope.roundTo = Math.roundTo
    $scope.inAll = Calc.inAll

    $scope.toMinScore = function (id, score) {
      return ($scope.data[id].config.simplified && typeof Config.SimplMinScore !== 'undefined' && score < Config.SimplMinScore ? Config.SimplMinScore : score)
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
        for (let id of $scope.categories) {
          var keys = Object.keys($scope.data[id].participants)
          for (var i = 0; i < keys.length; i++) {
            delete $scope.data[id].participants[keys[i]].rank
          }
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
      if ( ($scope.rankAll ? confirm('You have turned on "Rank Everyone in Everything", click OK to export anyways\nNote that if you export results with "Rank Everyone in Everything" turned on it is important that those are NOT considered official, final results') : true)) {
        // $scope.toggleRankAll(true)
        setTimeout(function () {
          var tables = document.getElementsByTagName('table')
          tables = Array.prototype.slice.call(tables)
          tables.filter(el => el.getAttribute('name') !== 'raw')
          tablesToExcel(tables, ($scope.categories.length === 1 ? $scope.data[$scope.categories[0]].config.name : ($scope.group ? $scope.group : 'All Results')))
        })
      }
    }

    $scope.processFile = function (evt) {
      console.log('File detected, attempting parse')
      let files = evt.target.files
      let category = evt.target.id.split('-')
      category = category[category.length - 1]
      let file = files[0]
      if (!file.type.match('image.*')) return
      let reader = new FileReader()
      reader.onload = function () {
        let data = this.result
        $scope.$apply(function () {
          if (typeof $scope.data[category].config.print === 'undefined') $scope.data[category].config.print = {}
          $scope.data[category].config.print.logo = data
        })
      }
      reader.readAsDataURL(file)
    }

    $scope.save = function () {
      $scope.data[$scope.id].config = Cleaner($scope.data[$scope.id].config)
      if ($scope.data[$scope.id].config !== null && typeof $scope.data[$scope.id].config === 'object' && Object.keys($scope.data[$scope.id].config).length === 0) {
        delete $scope.data[$scope.id].config
      }

      Db.set($scope.data)
    }
  })
