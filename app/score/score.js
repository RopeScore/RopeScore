/* global angular */
'use strict'
/**
 * @class ropescore.score
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.score', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/score/:id/:uid/:event', {
        templateUrl: '/score/score.html',
        controller: 'ScoreCtrl'
      })
    }
  ])

  /**
   * @class ropescore.score.ScoreCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ScoreCtrl', function ($scope, $location, $routeParams, Db, Abbr,
    Num, Config, Calc, Display, Cleaner) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id
    $scope.uid = $routeParams.uid
    $scope.event = $routeParams.event
    $scope.MissJudges = Config.MissJudges
    $scope.setID($scope.id)

    $scope.Abbr = Abbr
    $scope.getNumber = Num
    $scope.roundTo = Math.roundTo
    $scope.freestyle = Calc.freestyle
    $scope.simplified = $scope.data[$scope.id].config.simplified
    $scope.Order = ($scope.simplified ? Config.SimplOrder || Config.Order : Config.Order)
    $scope.NoMisses = ($scope.simplified ? Config.SimplNoMisses || Config.NoMisses : Config.NoMisses)
    console.log('simplOrder:', Config.SimplOrder, 'Order:', $scope.Order)
    console.log('NoMisses:', $scope.NoMisses)

    $scope.typeLookup = {
      a: 'Presentation',
      b: 'Required Elements',
      d: 'Difficulty',
      h: 'Head Judge',
      m: 'Misses'
    }

    $scope.shortDesc = function (desc) {
      return /<b>(.*)<\/b>/.exec(desc)[1]
    }

    // window.onbeforeprint = function () {
    //   alert('You might need to manually set ')
    // }

    /**
     * calculate scores, used for speed scores
     * @return {?Object} object with score
     */
    $scope.score = function () {
      if (typeof $scope.data[$scope.id].scores === 'undefined' || typeof $scope.data[$scope.id].scores[$scope.uid] === 'undefined') {
        return undefined
      }
      $scope.currScore = Calc.score($scope.event, $scope.data[$scope.id].scores[$scope.uid][$scope.event], $scope.uid)
      return $scope.currScore
    }

    /**
     * returns true if a reskip is allowed i.e if the scores varies by more than
     * 3 between all judges
     * @return {Boolean}
     */
    $scope.reskipAllowed = function () {
      if (typeof $scope.data[$scope.id].scores === 'undefined' || typeof $scope.data[$scope.id].scores[$scope.uid] === 'undefined' || typeof $scope.data[$scope.id].scores[$scope.uid][$scope.event] === 'undefined' || typeof $scope.data[$scope.id].scores[$scope.uid][$scope.event].s === 'undefined') {
        return false
      }
      var scores = Object.keys($scope.data[$scope.id].scores[$scope.uid][$scope.event].s).map(function (el) {
        return $scope.data[$scope.id].scores[$scope.uid][$scope.event].s[el]
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
      $scope.data[$scope.id].scores[$scope.uid][$scope.event].reskip = bool
      return bool
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

    /**
     * rounds a score input to its max="" value if it is above it's max
     * @param  {String} j judge type (a,b,d,m,h)
     * @param  {Number} i judge number (index)
     * @param  {String} t type (Interactions,releases,use of music...)
     * @return {undefined}
     */
    $scope.toMax = function (j, i, t) {
      var el = document.getElementById((j) + (i) + (t))
      var regEx = /[^\d.]+/gi

      var preVal = el.value.trim().replace(',', '.').replace(regEx, '')
      var val = Number(preVal)
      var max = Number(el.max.replace(',', '.'))

      $scope.data[$scope.id].scores[$scope.uid][$scope.event][j][i][t] = preVal

      /* mark the input with a yellow border for 5 seconds */
      if (typeof max !== 'undefined' && val > max) {
        $scope.data[$scope.id].scores[$scope.uid][$scope.event][j][i][t] = max
        el.classList.add('yellow')
        setTimeout(function () {
          el.classList.remove('yellow')
        }, 5000)
      }
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
      $scope.save()
    }

    /**
     * Clean data, Save data and return to category page
     * @return {undefined}
     */
    $scope.save = function () {
      $scope.data[$scope.id].scores = $scope.clean($scope.data[$scope.id].scores)
      if ($scope.data[$scope.id].scores !== null && typeof $scope.data[$scope.id].scores === 'object' && Object.keys($scope.data[$scope.id].scores).length === 0) {
        delete $scope.data[$scope.id].scores
      }
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }
  })
