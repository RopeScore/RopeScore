/* global angular */
'use strict'
/**
 * @class ropescore.config.rslive
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.config.rslive', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/config/rslive/:id', {
        templateUrl: '/config/config.rslive.html',
        controller: 'RSLiveCtrl'
      })
    }
  ])

  /**
   * @class ropescore.config.rslive.RSLiveCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('RSLiveCtrl', function ($scope, $location, $routeParams, Db,
    Config, Live) {
  })
