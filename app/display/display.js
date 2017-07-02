'use strict';
/**
 * @class ropescore.display
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.display', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/display', {
        templateUrl: '/display/display.html',
        controller: 'DisplayCtrl'
      });
    }
  ])

  /**
   * @class ropescore.display.DisplayCtrl
   */
  .controller('DisplayCtrl', function($scope, Db, Calc, Abbr, Config) {
    $scope.dataNow = function() {
      return Db.get()
    }
    $scope.data = $scope.dataNow();
    dbSocket.onmessage = function(evt) {
      var data = JSON.parse(evt.data)
      if (data.type != 'update') return;
      console.log('Update ng')
      $scope.data = Db.get()
      setTimeout(function() {
        $scope.$apply();
      })
    }

    $scope.score = function(event, data, uid, id, ret) {
      return Calc.score(event, data, uid, id, ret, $scope)
    }

    $scope.roundTo = Math.roundTo;

    if (typeof $scope.data.globconfig == 'undefined') $scope.data.globconfig = {}
    if (typeof $scope.data.globconfig.display == 'undefined') $scope.data.globconfig
      .display = {}

    if ($scope.speed) {} else {
      $scope.uid = $scope.data.globconfig.display.uid || '';
      $scope.event = $scope.data.globconfig.display.event || '';
    }

    $scope.Abbr = Abbr;
  })
