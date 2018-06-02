/* global angular, lsbridge */
'use strict'
/**
 * @class ropescore.display
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.display', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/display', {
        templateUrl: '/display/display.html',
        controller: 'DisplayCtrl'
      })
    }
  ])

  /**
   * @class ropescore.display.DisplayCtrl
   */
  .controller('DisplayCtrl', function ($scope, $interval, Db, Calc, Abbr, Config) {
    $scope.data = Db.get()
    var interval

    /**
     * update the display on backend message
     * @param  {Object} evt
     * @return {undefined}
     */
    lsbridge.subscribe('ropescore-updates', function (data) {
      if (data.type !== 'update') return
      console.log('Update ng')
      updateScores()
      setTimeout(function () {
        $scope.$apply()
      })
    })

    /**
     * update the display
     * @return {undefined}
     */
    var updateScores = function () {
      if (angular.isDefined(interval)) {
        $interval.cancel(interval)
        interval = undefined
      }
      /** @type {Object} */
      $scope.data = Db.get()
      if (typeof $scope.data.globconfig === 'undefined') $scope.data.globconfig = {}
      if (typeof $scope.data.globconfig.display === 'undefined') $scope.data.globconfig.display = {}
      /** @type {String} id of category to display */
      var id = $scope.data.globconfig.display.id
      /** @type {Boolean} if speed or freestyles are currently displayed */
      var speed = $scope.data.globconfig.display.speed
      var i
      $scope.scores = {}

      if (speed && typeof $scope.data.globconfig.display.events !== 'undefined') {
        /** @type {Object[]} */
        var events = $scope.data.globconfig.display.events
        for (i = 0; i < events.length; i++) {
          if (typeof $scope.scores[events[i].uid] === 'undefined') {
            $scope.scores[events[i].uid] = {}
          }
          if (typeof $scope.data[id].scores === 'undefined' || typeof $scope.data[id].scores[events[i].uid] === 'undefined' || typeof $scope.data[id].scores[events[i].uid][events[i].event] === 'undefined') {
            $scope.scores[events[i].uid][events[i].event] = {hide: true}
          } else if ($scope.data[id].scores[events[i].uid][events[i].event].dns) {
            $scope.scores[events[i].uid][events[i].event] = {dns: true}
          } else {
            $scope.scores[events[i].uid][events[i].event] = Calc.score(events[i].event, $scope.data[id].scores[events[i].uid][events[i].event], events[i].uid, $scope.data[id].config.simplified)
          }
        }

        interval = $interval(function () {
          $scope.data.globconfig.display.events.unshift($scope.data.globconfig.display.events.pop())
        }, 5000)
      } else if (typeof $scope.data.globconfig.display.event !== 'undefined') {
        /** @type {Object[]} */
        var event = $scope.event = $scope.data.globconfig.display.event

        if (typeof $scope.scores[event.uid] === 'undefined') {
          $scope.scores[event.uid] = {}
        }
        $scope.scores[event.uid][event.event] = Calc.score(event.event, $scope.data[id].scores[event.uid][event.event], event.uid, $scope.data[id].config.simplified)
      }
    }
    updateScores()

    $scope.roundTo = Math.roundTo

    if (typeof $scope.data.globconfig === 'undefined') $scope.data.globconfig = {}
    if (typeof $scope.data.globconfig.display === 'undefined') {
      $scope.data.globconfig.display = {}
    }

    $scope.Abbr = Abbr
  })
