/* global angular, btoa */
'use strict'
/**
 * @class ropescore.dash
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.combine', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/combine', {
        templateUrl: '/combine/combine.html',
        controller: 'CombineCtrl'
      })
    }
  ])

  /**
   * @class ropescore.dash.DashCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} Db
   */
  .controller('CombineCtrl', function ($scope, $location, Checksum, Db, Config) {
    $scope.data = Db.get()

    /** unset the category id */
    $scope.setID(null)

    $scope.checksum = Checksum

    $scope.toCombine = {
      '0': {},
      '1': {},
      'new': {}
    }

    $scope.combine = function (obj) {
      if (typeof obj['0'].id === 'undefined' || typeof obj['1'].id === 'undefined') {
        return
      }
      var output = {
        config: {
          idStart: (obj.new.idStart && obj.new.idStart !== '' ? Number(obj.new.idStart) : $scope.data[obj['0'].id].config.idStart),
          name: (obj.new.name && obj.new.name !== '' ? obj.new.name : $scope.data[obj['0'].id].config.name + ' + ' + $scope.data[obj['1'].id].config.name),
          subevents: {},
          judges: {}
        },
        participants: {},
        scores: {}
      }
      var events0
      var events1
      var i = 0
      var j = 0
      var cuid = output.config.idStart

      if (obj.new.simplified) {
        output.config.simplified = (obj.new.simplified && obj.new.simplified === 'simplified')
      } else {
        output.config.simplified = ($scope.data[obj['0'].id].config.simplified || $scope.data[obj['1'].id].config.simplified) || false // would be undefined without `|| false`
      }

      // merge judges and subevents
      if (typeof $scope.data[obj['0'].id].config.subevents !== 'undefined') events0 = Object.keys($scope.data[obj['0'].id].config.subevents)
      if (typeof $scope.data[obj['1'].id].config.subevents !== 'undefined') events1 = Object.keys($scope.data[obj['1'].id].config.subevents)
      var events = [].concat(events0 || []).concat(events1 || []).filter(function (evt) {
        return ($scope.data[obj['0'].id].config.subevents[evt] || $scope.data[obj['1'].id].config.subevents[evt])
      })

      for (i = 0; i < events.length; i++) {
        output.config.subevents[events[i]] = true

        output.config.judges[events[i]] = $scope.data[obj['0'].id].config.judges[events[i]] || {}

        if (typeof $scope.data[obj['1'].id].config.judges[events[i]] !== 'undefined') {
          var judges1 = Object.keys($scope.data[obj['1'].id].config.judges[events[i]])
          for (j = 0; j < judges1.length; j++) {
            output.config.judges[events[i]][judges1[j]] = Math.max(output.config.judges[events[i]][judges1[j]] || 0, $scope.data[obj['1'].id].config.judges[events[i]][judges1[j]] || 0)
          }
        }
      }

      // participants
      for (i = 0; i <= 1; i++) {
        if (typeof $scope.data[obj['' + i].id].participants !== 'undefined') {
          var uids = Object.keys($scope.data[obj['' + i].id].participants)

          for (j = 0; j < uids.length; j++) {
            output.participants[cuid] = $scope.data[obj['' + i].id].participants[uids[j]]

            if (typeof $scope.data[obj['' + i].id].scores !== 'undefined' && typeof $scope.data[obj['' + i].id].scores[uids[j]] !== 'undefined') {
              output.scores[cuid] = $scope.data[obj['' + i].id].scores[uids[j]]
            }

            cuid++
          }
        }
      }

      console.log(output, $scope.data[obj['0'].id], $scope.data[obj['1'].id])

      var newId = btoa(new Date().getTime())
      console.log(`saving combined event with id: ${$scope.id}`)

      $scope.data[newId] = output
      $scope.save()
      $scope.status = 'Combined category saved'

      return output
    }

    /**
     * make a new array with every category's id from the data object, to use in
     * ng-repeat with ngSort
     * @return {String[]}
     */
    $scope.getEventsArray = function () {
      if (typeof $scope.data !== 'undefined') {
        var arr = Object.keys($scope.data)
        arr = arr.filter(function (str) {
          return str !== 'globconfig'
        })
        return arr
      }
    }

    /**
     * saves the data
     * @return {undefined}
     */
    $scope.save = function () {
      Db.set($scope.data)
    }

    console.log(Config)
  })
