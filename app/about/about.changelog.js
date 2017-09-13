/* global angular */
'use strict'
/**
 * @class ropescore.about.changelog
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.about.changelog', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/changelog', {
        templateUrl: '/about/about.changelog.html',
        controller: 'ChangelogCtrl'
      })
    }
  ])

  /**
   * @class ropescore.about.changelog.ChangelogCtrl
   */
  .controller('ChangelogCtrl', function ($scope, $anchorScroll, $location) {
    $scope.anchor = $location.hash()
    /** Configure $anchorScroll to take the navbar into consideration */
    $anchorScroll.yOffset = 60
    /** Scroll To anchor */
    $anchorScroll()
  })
