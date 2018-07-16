/* global angular */
'use strict'
/**
 * @class ropescore.category
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.category', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/category/:id', {
        templateUrl: '/category/category.html',
        controller: 'CategoryCtrl'
      })
    }
  ])

  /**
   * @class ropescore.category.CategoryCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('CategoryCtrl', function ($scope, $location, $routeParams, Db, Abbr,
    Checksum, Live, Config) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id
    $scope.setID($scope.id)
    $scope.Abbr = Abbr

    $scope.events = Abbr.events()

    $scope.hasSpeed = Abbr.hasSpeed($scope.data[$scope.id].config.subevents)

    $scope.checksum = Checksum
    /**
     * checksum of nothing, used to find out ewhen there is no data
     * @type {String}
     */
    $scope.blankChk = $scope.checksum()

    /**
     * marks a category as complete
     * @return {undefined}
     */
    $scope.complete = function () {
      $scope.data[$scope.id].config.completed = !$scope.data[$scope.id].config.completed
      Db.set($scope.data)
    }

    setTimeout(function () {
      Live.scores($scope.id)
    })
  })
