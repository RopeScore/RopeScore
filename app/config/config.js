/* global confirm, btoa, angular */
'use strict'
/**
 * @class ropescore.config
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.config', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/config/:id?', {
        templateUrl: '/config/config.html',
        controller: 'ConfigCtrl'
      })
    }
  ])

  /**
   * @class ropescore.config.ConfigCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ConfigCtrl', function ($scope, $location, $routeParams, Db, Abbr,
    Config, Live, Cleaner) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id
    if (!$scope.id) {
      $scope.id = btoa(new Date().getTime())
      $scope.isNew(true)
      console.log(`new event with id: ${$scope.id}`)
    }
    $scope.setID($scope.id)

    /**
     * Saves data and continues to articipant configuration. won't save empty data
     * @return {undefined} function does not return
     */
    $scope.save = function () {
      if (typeof $scope.data[$scope.id] === 'undefined' || typeof $scope.data[$scope.id].config === 'undefined') {
        $scope.error = 'You can\'t have an empty category'
        return
      }

      $scope.data[$scope.id].config = Cleaner($scope.data[$scope.id].config)
      if ($scope.data[$scope.id].config !== null && typeof $scope.data[$scope.id].config === 'object' && Object.keys($scope.data[$scope.id].config).length === 0) {
        delete $scope.data[$scope.id].config
      }

      if (typeof $scope.data[$scope.id] === 'undefined' || typeof $scope.data[$scope.id].config === 'undefined') {
        $scope.error = 'You can\'t have an empty category'
        return
      }

      Db.set($scope.data)
      Live.config($scope.id)
      $location.path('/config/participants/' + $scope.id)
    }

    $scope.MissJudges = Config.MissJudges
    $scope.Simplified = Config.Simplified

    $scope.remove = function () {
      if (confirm('Are you sure you want to remove this category and all of its data?\nThis will NOT remove the category from RopeScore Live if it has been synced')) {
        console.log(`removing ${$scope.id}`)
        delete $scope.data[$scope.id]
        Db.set($scope.data)
        $location.path('/')
      }
    }

    $scope.removeLive = function () {
      if (!confirm('Are you sure you want to queue this category from deletion in RopeScore Live')) return
      Live.delete($scope.id)
      if (typeof $scope.data[$scope.id].config !== 'undefined' && typeof $scope.data[$scope.id].config.live !== 'undefined') {
        $scope.data[$scope.id].config.live = false
      }
      $scope.save()
    }

    $scope.eventsWithScores = {}

    if (typeof $scope.data[$scope.id] !== 'undefined' && typeof $scope.data[$scope.id].scores !== 'undefined') {
      Object.keys($scope.data[$scope.id].scores).map(function (uid) {
        return Object.keys($scope.data[$scope.id].scores[uid])
      }).reduce(function (accumulator, currentValue) {
        return accumulator.concat(currentValue)
      }, []).filter(function (value, index, self) {
        return self.indexOf(value) === index
      }).forEach(function (abbr) {
        console.log(abbr)
        $scope.eventsWithScores[abbr] = true
      })
    }

    $scope.Abbr = Abbr
  })
