/* global angular, FileReader, confirm, pad, nameCleaner */
'use strict'
/**
 * @class ropescore.dash
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.dash', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: '/dash/dash.html',
        controller: 'DashCtrl'
      })
    }
  ])

  /**
   * @class ropescore.dash.DashCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} Db
   */
  .controller('DashCtrl', function ($scope, $route, $location, Checksum, Db, Config) {
    $scope.data = Db.get()

    /** unset the category id */
    $scope.setID(null)

    let date = new Date()
    $scope.today = pad(date.getFullYear(), 4) + '' + pad(date.getMonth() + 1, 2) + '' + pad(date.getDate(), 2)

    /**
     * make a link for a file to save the data as json
     * @type {String}
     */
    $scope.linkData = 'data:application/json;base64,' + window.btoa(unescape(encodeURIComponent(JSON.stringify($scope.data))))

    /**
     * resets the system by deleting all data
     * @return {undefined}
     */
    $scope.reset = function () {
      $scope.data = {}
      $route.reload()
      Db.set($scope.data)
      // Db.set({}, 'rslive-config')
      // Db.set('', 'computer-name')
      // $scope.updateGlobConfig()
    }

    $scope.checksum = Checksum
    $scope.nameCleaner = nameCleaner

    /**
     * make a new array with every category's id from the data object, to use in
     * ng-repeat with ngSort
     * @return {String[]}
     */
    $scope.getEventsArray = function () {
      if (typeof $scope.data !== 'undefined' || (typeof $scope.data === 'object' && Object.keys($scope.data).length > 0)) {
        var arr = Object.keys($scope.data)
        arr = arr.filter(function (str) {
          return str !== 'globconfig' && !$scope.data[str].config.completed
        })
        return arr
      } else {
        return []
      }
    }

    /**
     * make a new array with every category's id from the data object, to use in
     * ng-repeat with ngSort
     * @return {String[]}
     */
    $scope.getCompletedEventsArray = function () {
      if (typeof $scope.data !== 'undefined' || (typeof $scope.data === 'object' && Object.keys($scope.data).length > 0)) {
        var arr = Object.keys($scope.data)
        arr = arr.filter(function (str) {
          return str !== 'globconfig' && $scope.data[str].config.completed
        })
        return arr
      } else {
        return []
      }
    }

    /**
     * get the resulting position of an ordered event based on it's id and offset
     * @param  {String} id
     * @return {Number}    index * 2 + offset
     */
    $scope.getOrder = function (id) {
      if (typeof $scope.data === 'undefined' ||
      typeof $scope.data.globconfig === 'undefined' ||
      typeof $scope.data.globconfig.order === 'undefined') {
        return $scope.getEventsArray().indexOf(id)
      }
      return $scope.data.globconfig.order[id] + $scope.getEventsArray().indexOf(id) * 2 || $scope.getEventsArray().indexOf(id) * 2
    }

    /**
     * reset the ordering
     * @return {undefined}
     */
    $scope.resetOrder = function () {
      delete $scope.data.globconfig.order
      $scope.save()
    }

    /**
     * saves the data
     * @return {undefined}
     */
    $scope.save = function () {
      Db.set($scope.data)
    }

    console.log(Config)

    document.getElementById('import-file')
      .addEventListener('change', function (evt) {
        console.log('File detected, attempting parse')
        var files = evt.target.files
        var file = files[0]
        var reader = new FileReader()
        reader.onload = function () {
          var data = JSON.parse(this.result)
          if (confirm('This will overwrite ALL your existing data.\nRopeScore Live API details and the computers name will be reset.')) {
            Db.set(data)
            $scope.$apply(function () {
              $scope.data = data
            })
          }
        }
        reader.readAsText(file)
      }, false)
  })
