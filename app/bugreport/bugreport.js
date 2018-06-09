/* global angular, store */
'use strict'
/**
 * @class ropescore.bugreport
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.bugreport', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/bugreport', {
        templateUrl: '/bugreport/bugreport.html',
        controller: 'BugCtrl'
      })
    }
  ])

  /**
   * @class ropescore.bugreport.BugCtrl
   * @param {service} $scope
   * @param {service} Db
   */
  .controller('BugCtrl', function ($scope, Db) {
    $scope.data = Db.get()
    $scope.log = store.get('console-history')
    $scope.show = {}

    $scope.linkData = 'data:application/json;base64,' + window.btoa(unescape(encodeURIComponent(JSON.stringify($scope.data))))
    $scope.logLinkData = 'data:application/json;base64,' + window.btoa(unescape(encodeURIComponent(JSON.stringify($scope.log))))

    /**
     * [description]
     * @param  {string}    thing 'log' or 'data', which to toggle
     * @return {undefined}       Doesn't return
     */
    $scope.toggle = function (thing) {
      if (thing === 'data') {
        $scope.show = {
          data: !$scope.show.data,
          log: false
        }
      } else if (thing === 'log') {
        $scope.show = {
          data: false,
          log: !$scope.show.log
        }
      }
    }
  })
