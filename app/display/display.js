/* global angular, dbSocket */
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
  .controller('DisplayCtrl', function ($scope, Db, Calc, Abbr, Config) {
    $scope.data = Db.get()

    /**
     * update the display on backend message
     * @param  {Object} evt
     * @return {undefined}
     */
    dbSocket.onmessage = function (evt) {
      var data = JSON.parse(evt.data)
      if (data.type !== 'update') return
      console.log('Update ng')
      updateScores()
      setTimeout(function () {
        $scope.$apply()
      })
    }

    /**
     * update the display
     * @return {undefined}
     */
    var updateScores = function () {
      /** @type {Object} */
      $scope.data = Db.get()
      /** @type {String} id of category to display */
      var id = $scope.data.globconfig.display.id
      /** @type {Boolean} if speed or freestyles are currently displayed */
      var speed = $scope.data.globconfig.display.speed
      var i
      $scope.scores = {}

      if (speed) {
        /** @type {Object[]} */
        var events = $scope.data.globconfig.display.events
        for (i = 0; i < events.length; i++) {
          if (typeof $scope.scores[events[i].uid] === 'undefined') {
            $scope.scores[events[i].uid] = {}
          }
          $scope.scores[events[i].uid][events[i].event] = Calc.score(events[i].event, $scope.data[id].scores[events[i].uid][events[i].event], events[i].uid, $scope.data[id].config.simplified)
        }
      } else {
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
