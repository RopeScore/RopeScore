'use strict';
/**
 * @class ropescore.event
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.event', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/event/:id', {
        templateUrl: '/event/event.html',
        controller: 'EventCtrl'
      });
    }
  ])

  /**
   * @class ropescore.event.EventCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('EventCtrl', function($scope, $location, $routeParams, Db, Abbr,
    Config) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.setID($scope.id)
    $scope.Abbr = Abbr;

    $scope.events = Abbr.events;

    $scope.checksum = function(obj, n) {
      var string = (obj ? JSON.stringify(obj) : '')
      var hash = sha1(string)
      var o = Config.CheckStart
      var checksum = hash.substring(o, o + n)
      return checksum;
    }
  })
