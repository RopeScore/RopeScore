/* global angular */
'use strict'
/**
 * @class ropescore.score.speed
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.score.speed', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/speedscore/:id/:event?', {
        templateUrl: '/score/score.speed.html',
        controller: 'SpeedScoreCtrl'
      })
    }
  ])

  /**
   * @class ropescore.score.SpeedScoreCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('SpeedScoreCtrl', function ($scope, $location, $routeParams, $timeout, Db,
    Abbr, Display, Calc, Num, Config, Cleaner) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id
    $scope.events = [$routeParams.event]
    $scope.setID($scope.id)

    if ($scope.events[0] === undefined) {
      $scope.events = Abbr.events().filter(function (evt) {
        return Abbr.isSpeed(evt) && $scope.data[$scope.id].config.subevents[evt]
      })
    }

    $scope.Abbr = Abbr
    $scope.getNumber = Num
    $scope.roundTo = Math.roundTo

    /**
     * calculate spped score for a particular event with given data for a particular uid
     * @param  {String} event
     * @param  {Object} data
     * @param  {String} uid
     * @return {Object}
     */
    $scope.score = function (event, data, uid) {
      if (typeof data === 'undefined') {
        return undefined
      }
      return Calc.score(event, data, uid)
    }

    $scope.scores = {}
    $scope.calcCache = {}

    $scope.calc = function (event, data, uid) {
      if (typeof $scope.scores[uid] === 'undefined') {
        $scope.scores[uid] = {}
      }
      if (typeof $scope.calcCache[uid] === 'undefined') {
        $scope.calcCache[uid] = {}
      }
      if (typeof $scope.calcCache[uid][event] !== 'undefined') {
        $timeout.cancel($scope.calcCache[uid][event])
      }

      $scope.calcCache[uid][event] = $timeout(function () {
        $scope.scores[uid][event] = $scope.score(event, data, uid)
      }, 500)
    }

    let participants = Object.keys($scope.data[$scope.id].participants)
    for (let i = 0; i < participants.length; i++) {
      let uid = participants[i]

      if (typeof $scope.scores[uid] === 'undefined') {
        $scope.scores[uid] = {}
      }

      for (let j = 0; j < $scope.events.length; j++) {
        let event = $scope.events[j]
        $scope.scores[uid][event] = $scope.score(event, (($scope.data[$scope.id].scores || {})[uid] || {})[event], uid)
      }
    }

    /**
     * sends a message to the backend that notifies all other messages to update
     * the live display
     * @param  {String} uid   participant id
     * @param  {String} id    category id
     * @param  {String} event
     * @return {undefined}
     */
    $scope.display = function (uid, id, event) {
      Db.set($scope.data)
      Display.display(uid, id, event)
      $scope.data = Db.get()
    }

    $scope.clean = Cleaner

    /**
     * mark that the participant did not skip and save
     * @param  {String} uid   participant id
     * @param  {String} id    category id
     * @param  {String} event
     * @return {undefined}
     */
    $scope.dnsSave = function (uid, id, event) {
      $scope.data[id].scores[uid][event] = {dns: true}
      $scope.data[$scope.id].scores = $scope.clean($scope.data[$scope.id].scores)
      if ($scope.data[$scope.id].scores !== null && typeof $scope.data[$scope.id].scores === 'object' && Object.keys($scope.data[$scope.id].scores).length === 0) {
        delete $scope.data[$scope.id].scores
      }
      Db.set($scope.data)
    }

    /**
     * returns true if a reskip is allowed i.e if the scores varies by more than
     * 3 between all judges
     * @param  {uid}    participant id
     * @param  {id}     category id
     * @param  {event}
     * @return {Boolean}
     */
    $scope.reskipAllowed = function (uid, id, event) {
      if (typeof $scope.data[id].scores === 'undefined' || typeof $scope.data[id].scores[uid] === 'undefined' || typeof $scope.data[id].scores[uid][event] === 'undefined' || typeof $scope.data[id].scores[uid][event].s === 'undefined') {
        return undefined
      }
      var scores = Object.keys($scope.data[id].scores[uid][event].s).map(function (el) {
        return $scope.data[id].scores[uid][event].s[el]
      })
      var bools = []
      scores.sort(function (a, b) {
        return a - b
      })
      for (var i = 0; i < scores.length - 1; i++) {
        bools.push(scores[i + 1] - scores[i] > 3)
      }
      if (bools.length <= 0) {
        return false
      }
      var bool = bools.reduce(function (a, b) {
        return b && a
      })
      $scope.data[id].scores[uid][event].reskip = bool
      return bool
    }

    $scope.displayAll = function (participants, id, events) {
      $scope.save()

      if (typeof participants === 'undefined') {
        participants = []
      } else {
        participants = Object.keys(participants)
      }

      Display.displayAll(participants, id, events)
      $scope.data = Db.get()
    }

    /**
     * Clean data, Save data
     * @return {undefined}
     */
    $scope.save = function () {
      $scope.data[$scope.id].scores = $scope.clean($scope.data[$scope.id].scores)
      if ($scope.data[$scope.id].scores !== null && typeof $scope.data[$scope.id].scores === 'object' && Object.keys($scope.data[$scope.id].scores).length === 0) {
        delete $scope.data[$scope.id].scores
      }
      Db.set($scope.data)
    }

    /**
     * Clean data, Save data and return to category page
     * @return {undefined}
     */
    $scope.saveReturn = function () {
      $scope.save()
      $location.path('/category/' + $scope.id)
    }
  })
