/* global angular, FileReader, confirm */
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
  .controller('DashCtrl', function ($scope, $location, Checksum, Db, Config) {
    $scope.data = Db.get()

    $scope.setID(null)

    $scope.linkData = 'data:application/json;base64,' +
      window.btoa(unescape(encodeURIComponent(JSON.stringify($scope.data))))

    $scope.save = function () {
      Db.set($scope.data)
    }

    $scope.reset = function () {
      $scope.data = {}
      Db.set($scope.data)
    }

    $scope.checksum = Checksum

    $scope.getEventsArray = function () {
      if (typeof $scope.data !== 'undefined') {
        var arr = Object.keys($scope.data)
        arr = arr.filter(function (str) {
          return str !== 'globconfig'
        })
        return arr
      }
    }

    $scope.getOrder = function (id) {
      if (typeof $scope.data === 'undefined' ||
      typeof $scope.data.globconfig === 'undefined' ||
      typeof $scope.data.globconfig.order === 'undefined') {
        return $scope.getEventsArray().indexOf(id)
      }
      return $scope.data.globconfig.order[id] + $scope.getEventsArray().indexOf(id) * 2 || $scope.getEventsArray().indexOf(id) * 2
    }

    $scope.resetOrder = function () {
      delete $scope.data.globconfig.order
      $scope.save()
    }

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
          if (confirm('This will overwrite ALL your existing data')) {
            Db.set(data)
            $scope.$apply(function () {
              $scope.data = data
            })
          }
        }
        reader.readAsText(file)
      }, false)
  })
