/* global angular */
'use strict'
/**
 * @class ropescore.globconfig
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.globconfig', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/globconfig', {
        templateUrl: '/globconfig/globconfig.html',
        controller: 'GlobConfigCtrl'
      })
    }
  ])

  /**
   * @class ropescore.globconfig.GlobConfigCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} Db
   */
  .controller('GlobConfigCtrl', function ($scope, $location, Db, Abbr,
    Config, Cleaner) {
    $scope.data = Db.get()

    /**
     * Saves data and continues to articipant configuration. won't save empty data
     * @return {undefined} function does not return
     */
    $scope.save = function () {
      $scope.data.globconfig = Cleaner($scope.data.globconfig)
      if ($scope.data.globconfig !== null && typeof $scope.data.globconfig === 'object' && Object.keys($scope.data.globconfig).length === 0) {
        delete $scope.data.globconfig
      }

      Db.set($scope.data)
      Db.set($scope.computerName, 'computer-name')
      Db.set($scope.liveConfig, 'rslive-config')
      $scope.updateGlobConfig()
      $location.path('/')
    }
  })
