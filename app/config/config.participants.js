/* global angular, Papa */
'use strict'
/**
 * @class ropescore.config.participants
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.config.participants', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/config/participants/:id', {
        templateUrl: '/config/config.participants.html',
        controller: 'ParticipantsCtrl'
      })
    }
  ])

  /**
   * @class ropescore.config.participants.ParticipantsCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ParticipantsCtrl', function ($scope, $location, $routeParams, Db,
    Num, Config, Abbr, Live, tablesToExcel) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id
    $scope.setID($scope.id)

    $scope.data[$scope.id].config.idStart = $scope.data[$scope.id].config.idStart || 100

    $scope.getNumber = Num
    $scope.showAll = Config.ShowAllTables
    $scope.Abbr = Abbr

    $scope.addNum = 25

    /**
     * adds participants to $scope.data[$scope.id].participants
     * @return {undefined} does not return
     */
    $scope.add = function () {
      console.log(`adding ${$scope.addNum} participants`)
      var max = 0
      if ($scope.data[$scope.id].participants) {
        var ids = Object.keys($scope.data[$scope.id].participants)
        ids = ids.sort(function (a, b) {
          return b - a
        })
        max = Number(ids[0]) + 1
      } else {
        max = $scope.data[$scope.id].config.idStart
      }
      if (!$scope.data[$scope.id].participants) {
        $scope.data[$scope.id].participants = {}
      }
      for (var i = 0; i < $scope.addNum; i++) {
        $scope.data[$scope.id].participants[max + i] = {}
      }
    }

    /**
     * imports data from input box, copied tsv from excel supported
     * @return {undefined} does not return
     */
    $scope.import = function () {
      console.log(`attempting import`)
      var data = Papa.parse($scope.csv, {
        delimiter: '\t'
      })
      console.log(data)

      /**
       * @type {string[]}
       */
      var ids = ($scope.hasData() ? Object.keys($scope.data[$scope.id].participants) : [$scope.data[$scope.id].config.idStart])
      ids = ids.sort(function (a, b) {
        return b - a
      })
      var max = Number(ids[0]) + 1

      /**
       * indexes of certain headers
       * @type {Object.<String, Number>}
       */
      var indexes = {
        name: data.data[0].findIndex(function (el) {
          return el.toLowerCase().trim() === 'name'
        }),
        club: data.data[0].findIndex(function (el) {
          return el.toLowerCase().trim() === 'club'
        }),
        members: data.data[0].findIndex(function (el) {
          return el.toLowerCase().trim() === 'members'
        }),
        id: data.data[0].findIndex(function (el) {
          return el.toLowerCase().trim() === 'id'
        })
      }
      console.log(indexes)
      if ((indexes.name < 0 && indexes.club >= 0) ||
        (indexes.name >= 0 && indexes.club < 0)) {
        console.log('incomplete header, first row ignored')
        data.data.shift()
        indexes = {
          name: 0,
          club: 1,
          members: 2
        }
      } else if (indexes.name < 0 && indexes.club < 0) {
        console.log('no header')
        indexes = {
          name: 0,
          club: 1,
          members: 2
        }
      } else {
        data.data.shift()
      }
      for (var i = 0; i < data.data.length; i++) {
        var id
        var keys = ($scope.hasData() ? Object.keys(
          $scope.data[$scope.id].participants) : [])
        if (indexes.id >= 0 && keys.indexOf(data.data[i][indexes.id]) < 0) {
          id = data.data[i][indexes.id]
        } else {
          id = max + i
        }
        if (typeof $scope.data[$scope.id].participants === 'undefined') { $scope.data[$scope.id].participants = {} }
        $scope.data[$scope.id].participants[id] = {
          name: data.data[i][indexes.name],
          club: data.data[i][indexes.club]
        }
        if (typeof data.data[i][indexes.members] !== 'undefiend') $scope.data[$scope.id].participants[id].members = data.data[i][indexes.members]
      }
    }

    /**
     * export participant list to excel
     * @return {undefined} does not return
     */
    $scope.export = function () {
      var tables = [document.getElementById('partlist')]
      tablesToExcel(tables, $scope.data[$scope.id].config.name +
        '-participants')
    }

    /**
     * checks if there are any participants
     * @return {boolean} true if there are participants
     */
    $scope.hasData = function () {
      if (typeof $scope.data[$scope.id].participants === 'undefined') {
        return false
      }
      if (Object.keys($scope.data[$scope.id].participants).length < 1) {
        return false
      }
      return true
    }

    /**
     * removes a participant with a particular uid and its accociated data
     * @param  {String} uid uid of participant to remove
     * @return {undefined}  does not return
     */
    $scope.delete = function (uid) {
      console.log(`removing participant ${uid}`)
      $scope.$apply(delete $scope.data[$scope.id].participants[uid])
      $scope.$apply(delete $scope.data[$scope.id].scores[uid])
    }

    /**
     * Saves data and goes to event dashboard, doublechecks if no participants have been added
     * @return {undefined} does not return
     */
    $scope.save = function () {
      if (!$scope.overrideSave && !$scope.hasData()) {
        $scope.error = 'No participants? Sounds lonely... Press save again to override'
        $scope.overrideSave = true
        return
      }
      Db.set($scope.data)
      Live.participants($scope.id)
      $location.path('/category/' + $scope.id)
    }
  })
