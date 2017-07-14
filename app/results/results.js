'use strict';
/**
 * @class ropescore.results
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.results', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/results/:id', {
        templateUrl: '/results/results.html',
        controller: 'ResultsCtrl'
      });
    }
  ])

  /**
   * @class ropescore.results.ResultsCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ResultsCtrl', function($scope, $location,
    $routeParams, Db, Calc, Abbr, Num, Config, tablesToExcel) {
    $scope.dataNow = function() {
      return Db.get()
    }
    $scope.data = $scope.dataNow();
    // dbSocket.onmessage = function(evt) {
    //   var data = JSON.parse(evt.data)
    //   if (data.type != 'update') return;
    //   console.log('Update ng')
    //   $scope.data = Db.get()
    //   $scope.$apply();
    // }
    $scope.live = function() {
      if ($scope.isLive) {
        $scope.isLive = false;
        clearInterval($scope.interval)
        setTimeout(function() {
          console.log = console.__log
          console.log('live update stopped')
        }, 1000)
      } else {
        console.log('updating live')
        $scope.isLive = true;
        console.__log = console.log
        console.log = function() {
          return
        }
        $scope.interval = setInterval(function() {
          $scope.$apply()
        }, 1000)
      }
    }

    $scope.id = $routeParams.id;
    $scope.setID($scope.id)
    $scope.Abbr = Abbr
    $scope.getNumber = Num

    if ($scope.data[$scope.id].participants) {
      $scope.partArray = Object.keys($scope.data[$scope.id].participants)
        .map(function(key) {
          $scope.data[$scope.id].participants[key].uid = key;
          return $scope.data[$scope.id].participants[key];
        })
    } else {
      $scope.partArray = []
    }

    $scope.score = function(event, data, uid, ret) {
      return Calc.score(event, data, uid, $scope.id, ret, $scope)
    }

    $scope.rank = function(data, event, uid) {
      var events = Object.keys($scope.data[$scope.id].config.subevents)
      var enabled = 0;
      for (var i = 0; i < events.length; i++) {
        if ($scope.data[$scope.id].config.subevents[events[i]]) {
          enabled = enabled + 1;
        }
      }
      if (data != undefined && data[uid] != undefined && data[uid][event] !=
        undefined && (Abbr.isSpeed(event) || event == "ranksum")) {
        if (event == "ranksum" && !$scope.rankAll && ((Object.keys(data[
              uid])
            .length - 1) != enabled)) {
          return undefined;
        }

        var keys = Object.keys(data);
        var scores = [];
        var score = (data[uid] ? data[uid][event] || 0 : 0);
        var rank;
        var fac = 1;

        for (var i = 0; i < keys.length; i++) {
          if (event == "ranksum" && !$scope.rankAll && ((Object.keys(data[
                keys[i]])
              .length - 1) != enabled)) {
            // do nothing
          } else {
            scores.push(data[keys[i]][event] || 0)
          }
        }
        if (event == 'ranksum') {
          scores.sort(function(a, b) {
            return a - b; // sort ascending
          })
        } else {
          scores.sort(function(a, b) {
            return b - a; // sort descending
          })
        }
        rank = (score != undefined ? scores.indexOf(score) + 1 :
          undefined)

        if (!$scope.data[$scope.id].ranks) {
          $scope.data[$scope.id].ranks = {};
        }
        if (!$scope.data[$scope.id].ranks[uid]) {
          $scope.data[$scope.id].ranks[uid] = {};
        }

        if (($scope.data[$scope.id].config.simplified || $scope.data[$scope.id].config.showFactors) &&
          $scope.data[$scope.id].config.factors &&
          $scope.data[$scope.id].config.factors[event]) {
          fac = $scope.data[$scope.id].config.factors[event]
        }

        rank = rank * fac;

        if (event != 'ranksum' && rank > 0) {
          $scope.data[$scope.id].ranks[uid][event] = Number(rank) ||
            undefined;
        } else {
          $scope.data[$scope.id].participants[uid].rank = rank;
        }
        return (rank <= 0 ? undefined : rank)


      } else if (!Abbr.isSpeed(event) && data && data[uid] && data[uid]
            [event]) {
        var C;
        var D;
        var rank;
        var Crank;
        var Drank;
        var ranksum;
        var keys = Object.keys(data);
        var Cscores = [];
        var Dscores = [];
        var ranksums = [];
        var Cscore = (data[uid] && data[uid][event] ? data[uid][event].crea -
          (data[uid][event].deduc / 2) ||
          0 : 0);
        var Dscore = (data[uid] && data[uid][event] ? data[uid][event].diff -
          (data[uid][event].deduc / 2) ||
          0 : 0);
        var fac = 1;

        for (var i = 0; i < keys.length; i++) {
          if (data[keys[i]][event]) {
            Cscores.push(data[keys[i]][event].crea - (data[
              keys[i]][event].deduc / 2) || 0)
            Dscores.push(data[keys[i]][event].diff - (data[
              keys[i]][event].deduc / 2) || 0)
          }
        }
        Cscores.sort(function(a, b) {
          return b - a; // sort descending
        })
        Dscores.sort(function(a, b) {
          return b - a; // sort descending
        })
        Crank = (Cscore != undefined ? Cscores.indexOf(Cscore) + 1 :
          undefined)
        Drank = (Dscore != undefined ? Dscores.indexOf(Dscore) + 1 :
          undefined)
        ranksum = Number(Crank) + Number(Drank);

        // calc everyones Crank and Drank and push sum into an array
        for (var i = 0; i < keys.length; i++) {
          var CtempScore = (data[keys[i]] && data[keys[i]][event] ? data[
              keys[i]][event].crea - (data[
              keys[i]][event].deduc / 2) ||
            0 : 0)
          var DtempScore = (data[keys[i]] && data[keys[i]][event] ? data[
              keys[i]][event].diff - (data[
              keys[i]][event].deduc / 2) ||
            0 : 0)
          var CtempRank = (CtempScore != undefined ? Cscores.indexOf(
              CtempScore) + 1 :
            undefined)
          var DtempRank = (DtempScore != undefined ? Dscores.indexOf(
              DtempScore) + 1 :
            undefined)
          if (DtempRank > 0 && CtempRank > 0) {
            if (!$scope.data[$scope.id].hiddenRanks) {
              $scope.data[$scope.id].hiddenRanks = {}
            }
            if (!$scope.data[$scope.id].hiddenRanks[keys[i]]) {
              $scope.data[$scope.id].hiddenRanks[keys[i]] = {}
            }
            if (!$scope.data[$scope.id].hiddenRanks[keys[i]][event]) {
              $scope.data[$scope.id].hiddenRanks[keys[i]][event] = {}
            }
            $scope.data[$scope.id].hiddenRanks[keys[i]][event].crea =
              CtempRank;
            $scope.data[$scope.id].hiddenRanks[keys[i]][event].diff =
              DtempRank;
            var tempRanksum = Number(CtempRank) + Number(DtempRank);
            ranksums.push(tempRanksum)
          }
        }

        ranksums.sort(function(a, b) {
          return a - b; // sort ascending
        })

        rank = (ranksum != undefined ? ranksums.indexOf(ranksum) + 1 :
          undefined)

        if (($scope.data[$scope.id].config.simplified || $scope.data[$scope.id].config.showFactors) &&
          $scope.data[$scope.id].config.factors &&
          $scope.data[$scope.id].config.factors[event]) {
          fac = $scope.data[$scope.id].config.factors[event] || 1;
        } else if (event == 'srsf') {
          fac = 2;
        }

        rank = rank * fac;

        if (!$scope.data[$scope.id].ranks) {
          $scope.data[$scope.id].ranks = {};
        }
        if (!$scope.data[$scope.id].ranks[uid]) {
          $scope.data[$scope.id].ranks[uid] = {};
        }
        if (event != 'ranksum') {
          $scope.data[$scope.id].ranks[uid][event] = rank;
        }
        return rank
      }
    }

    $scope.finalscore = function(data) {
      if (data) {
        var keys = Object.keys(data)
        var subt = (keys.indexOf("final") >= 0 ? 1 : 0)
        var events = Object.keys($scope.data[$scope.id].config.subevents)
        var enabled = 0;
        for (var i = 0; i < events.length; i++) {
          if ($scope.data[$scope.id].config.subevents[events[i]]) {
            enabled = enabled + 1;
          }
        }
        if ($scope.rankAll || keys.length - subt == enabled) {
          var total = 0;
          data.final = undefined;
          var keys = Object.keys(data);
          for (var i = 0; i < keys.length; i++) {
            total = total + (Number(data[keys[i]]) || (data[keys[i]] &&
                data[
                  keys[i]].total ?
                Number(data[keys[i]].total) : 0) ||
              0);
          }
          data.final = total;
          return Math.roundTo(total, 2);
        }
      }
    }

    $scope.ranksum = function(data) {
      if (data) {
        var keys = Object.keys(data)
        var subt = (keys.indexOf("ranksum") >= 0 ? 1 : 0)
        var events = Object.keys($scope.data[$scope.id].config.subevents)
        var enabled = 0;
        for (var i = 0; i < events.length; i++) {
          if ($scope.data[$scope.id].config.subevents[events[i]]) {
            enabled = enabled + 1;
          }
        }
        if ($scope.rankAll || keys.length - subt == enabled) {
          var sum = 0;
          data.ranksum = undefined;
          var keys = Object.keys(data)
          for (var i = 0; i < keys.length; i++) {
            sum += data[keys[i]] || 0;
          }
          data.ranksum = (sum > 0 ? sum : undefined);
          return (sum > 0 ? sum : '');
        }
      }
    }

    $scope.roundTo = Math.roundTo;

    $scope.ShowDC = Config.ShowDC;
    $scope.ShowAllTables = Config.ShowAllTables;

    $scope.toggleRankAll = function(forceOff) {
      if ($scope.rankAll == true || forceOff) {
        var keys = Object.keys($scope.data[$scope.id].participants)
        for (var i = 0; i < keys.length; i++) {
          delete $scope.data[$scope.id].participants[keys[i]].rank
        }
        $scope.rankAll = false;
      } else {
        $scope.rankAll = true;
      }
    }

    $scope.toExcel = function() {
      $scope.isLive = false;
      $scope.toggleRankAll(true)
      setTimeout(function() {
        var tables = document.getElementsByTagName('table');
        tables = Array.prototype.slice.call(tables)
        tables.shift();
        tablesToExcel(tables, $scope.data[$scope.id].config.name)
      })
    }

    $scope.speedFactor = Calc.speedFactor
  })
