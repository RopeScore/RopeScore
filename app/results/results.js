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
  .controller('ResultsCtrl', function($scope, $location, $routeParams, Db, Abbr,
    Num) {
    $scope.data = Db.get()

    $scope.id = $routeParams.id;
    $scope.setID($scope.id)
    $scope.Abbr = Abbr
    $scope.getNumber = Num

    $scope.partArray = Object.keys($scope.data[$scope.id].participants)
      .map(function(key) {
        $scope.data[$scope.id].participants[key].uid = key;
        return $scope.data[$scope.id].participants[key];
      })

    $scope.score = function(event, data, uid) {
      if (Abbr.isSpeed(event) && data && data.s) {
        var scores = [];
        var T = 0;
        var W = 0;
        var Y = 0;
        var preY = 0;
        var diff;

        for (var i = 0; i < Object.keys(data.s)
          .length; i++) {
          scores.push(data.s[i])
        }
        scores = scores.sort(function(a, b) {
          return a - b
        })
        for (var i = 1; i < scores.length; i++) {
          var cdiff = Math.abs(scores[i] - scores[i - 1])
          if (!diff || cdiff <= diff) {
            diff = cdiff;
            T = (scores[i] + scores[i - 1]) / 2
          }
        }

        if (data.start) {
          W += 5;
        }
        if (data.switches) {
          W += 5 * (data.switches > 3 ? 3 : data.switches)
        }

        preY = T - W;

        if (event == 'srss') {
          Y = preY * 5;
        } else if (event == 'srsr') {
          Y = preY * 3;
        } else if (event == 'ddsr') {
          Y = preY * 2;
        } else {
          Y = preY * 1;
        }

        console.log("id:", uid, "event:", event, "T:", T, "W:", W, "preY:",
          preY, "Y:", Y)

        if (!$scope.data[$scope.id].finalscores) {
          $scope.data[$scope.id].finalscores = {};
        }
        if (!$scope.data[$scope.id].finalscores[uid]) {
          $scope.data[$scope.id].finalscores[uid] = {};
        }

        $scope.data[$scope.id].finalscores[uid][event] = Y;
        return Math.roundTo(preY, 2);

      } else if (!Abbr.isSpeed(event) && data && data.a && data.b && data.d &&
        data.h) {
        var A = 0; // final score
        var T1 = 0; // diff score
        var T2 = 0; // dres score
        var T3 = 0; // reqi score
        var T4 = 0; // crea score
        var T5 = 0; // deductions
        var keys = [];
        var tempT = 0;
        var rem = 0;
        var diff = 0;
        var mim = 0;
        var mam = 0;
        var tim = 0;
        var spc = 0;
        var few = 0;
        var n = 0;
        var fac = 1;
        var scores = [];
        var calcdiff = [];
        var calcpres = [];
        var calcrq = [];
        var calchj = [];
        var lev = {};
        var l;
        var rq;
        var lmax;
        var lmin;


        /** Calc Points per level + rq */
        if ($scope.data[$scope.id].config.simplified) {
          lmin = 1;
          if (event == 'srsf') {
            l = function(x) {
              return (3 / (Math.pow(1.5, (5 - x))))
            }
            lmax = 6;
            rq = 50 / 14;
            fac = 2;
          } else if (event == 'srpf' || event == 'srtf') {
            l = function(x) {
              return (3.5 / (Math.pow(1.5, (4 - x))))
            }
            lmax = 6;
            rq = 50 / 16;
          } else if (event == 'ddsf' || event == 'ddpf') {
            l = function(x) {
              return (3 / (Math.pow(1.5, (4 - x))))
            }
            lmax = 5;
            rq = 50 / 16;
          }
        } else {
          lmin = 2;
          if (event == 'srsf') {
            l = function(x) {
              return (3 / (Math.pow(1.5, (6 - x))))
            }
            lmax = 6;
            rq = 50 / 14;
            fac = 2;
          } else if (event == 'srpf' || event == 'srtf') {
            l = function(x) {
              return (3.5 / (Math.pow(1.5, (5 - x))))
            }
            lmax = 6;
            rq = 50 / 16;
          } else if (event == 'ddsf' || event == 'ddpf') {
            l = function(x) {
              return (3 / (Math.pow(1.5, (5 - x))))
            }
            lmax = 5;
            rq = 50 / 16;
          }
        }

        for (var i = lmin; i <= lmax; i++) {
          lev[i] = Math.roundTo(l(i), 4)
        }

        /** calc T1 */
        n = Object.keys(data.d)
          .length;
        for (var i = 0; i < n; i++) {
          scores.push(data.d[i])
        }
        for (var i = 0; i < n; i++) {
          for (var p = lmin - 1; p < lmax; p++) {
            if (!calcdiff[i]) {
              calcdiff[i] = 0;
            }
            calcdiff[i] = Math.roundTo(calcdiff[i] +
              Math.roundTo((scores[i][p] || 0) * lev[p + 1], 4), 4)
          }
        }
        calcdiff.sort(function(a, b) {
          return a - b
        })


        if (n >= 4) {
          calcdiff.shift()
          calcdiff.pop()
          n = n - 2;
        } else if (n == 1) {} else if (n == 3) {
          var tempCalcdiff = [];
          var diff;
          for (var i = 1; i < n; i++) {
            var cdiff = Math.abs(calcdiff[i] - calcdiff[i - 1])
            if (!diff || cdiff <= diff) {
              diff = cdiff;
              tempCalcdiff = [calcdiff[i - 1], calcdiff[i]]
            }
          }
          n = 2;
          calcdiff = tempCalcdiff;
        }

        tempT = calcdiff.reduce(function(a, b) {
          return a + b
        })
        tempT = Math.roundTo(tempT / n, 4);

        T1 = Math.roundTo(tempT * 2.5, 4)

        /** Calc T2 */
        tempT = 0;
        scores = [];

        n = Object.keys(data.a)
          .length;
        for (var i = 0; i < n; i++) {
          scores.push(data.a[i])
        }
        for (var i = 0; i < scores.length; i++) {
          var keys = Object.keys(scores[i])
          for (var p = 0; p < keys.length; p++) {
            if (!calcpres[i]) {
              calcpres[i] = 0;
            }
            calcpres[i] = calcpres[i] + (scores[i][keys[p]] || 0)
            if (calcpres[i] > 40) {
              calcpres[i] = 40;
            }
          }
        }
        calcpres.sort(function(a, b) {
          return a - b
        })

        if (n >= 4) {
          calcpres.shift()
          calcpres.pop()
          n = n - 2;
        } else if (n == 1) {} else if (n == 3) {
          var tempCalcpres = [];
          var diff;
          for (var i = 1; i < n; i++) {
            var cdiff = Math.abs(calcpres[i] - calcpres[i - 1])
            if (!diff || cdiff <= diff) {
              diff = cdiff;
              tempCalcpres = [calcpres[i - 1], calcpres[i]]
            }
          }
          n = 2;
          calcpres = tempCalcpres;
        }

        tempT = calcpres.reduce(function(a, b) {
          return a + b
        })
        tempT = Math.roundTo(tempT / n, 4);
        T2 = Math.roundTo((tempT > 40 ? 40 * 5 : tempT * 5), 4)

        /** Calc T3 */
        tempT = 0;
        scores = [];

        n = Object.keys(data.b)
          .length;
        for (var i = 0; i < n; i++) {
          scores.push(data.b[i])
        }
        for (var i = 0; i < scores.length; i++) {
          var keys = Object.keys(scores[i])
          for (var p = 0; p < keys.length; p++) {
            if (!calcrq[i]) {
              calcrq[i] = 0;
            }
            calcrq[i] = calcrq[i] + (scores[i][keys[p]] || 0)
          }
        }
        calcrq.sort(function(a, b) {
          return a - b
        })

        if (n >= 4) {
          calcrq.shift()
          calcrq.pop()
          n = n - 2;
        } else if (n == 1) {} else if (n == 3) {
          var tempCalcrq = [];
          var diff;
          for (var i = 1; i < n; i++) {
            var cdiff = Math.abs(calcrq[i] - calcrq[i - 1])
            if (!diff || cdiff <= diff) {
              diff = cdiff;
              tempCalcrq = [calcrq[i - 1], calcrq[i]]
            }
          }
          n = 2;
          calcrq = tempCalcrq;
        }

        tempT = calcrq.reduce(function(a, b) {
          return a + b
        })
        tempT = Math.roundTo(tempT / n, 4);
        T3 = Math.roundTo((tempT * rq > 50 ? 50 : tempT * rq), 4)

        /** Calc T4 */
        T4 = T2 + T3;

        /** Calc T5 */
        tempT = 0;
        scores = [];

        n = Object.keys(data.mim)
          .length;
        keys = Object.keys(data.mim);
        for (var i = 0; i < n; i++) {
          scores.push(data.mim[keys[i]])
        }
        scores.sort(function(a, b) {
          return a - b
        })

        if (n >= 4) {
          scores.shift()
          scores.pop()
          n = n - 2;
        } else if (n == 1) {} else if (n == 3) {
          var tempMim = [];
          var diff;
          for (var i = 1; i < n; i++) {
            var cdiff = Math.abs(scores[i] - scores[i - 1])
            if (!diff || cdiff <= diff) {
              diff = cdiff;
              tempMim = [scores[i - 1], scores[i]]
            }
          }
          n = 2;
          scores = tempMim;
        }

        mim = scores.reduce(function(a, b) {
          return a + b
        })
        mim = Math.roundTo(mim / n, 4);

        scores = [];
        n = 0;
        keys = [];

        n = Object.keys(data.mam)
          .length;
        keys = Object.keys(data.mam);
        for (var i = 0; i < n; i++) {
          scores.push(data.mam[keys[i]])
        }
        scores.sort(function(a, b) {
          return a - b
        })

        if (n >= 4) {
          scores.shift()
          scores.pop()
          n = n - 2;
        } else if (n == 1) {} else if (n == 3) {
          var tempMam = [];
          var diff;
          for (var i = 1; i < n; i++) {
            var cdiff = Math.abs(scores[i] - scores[i - 1])
            if (!diff || cdiff <= diff) {
              diff = cdiff;
              tempMam = [scores[i - 1], scores[i]]
            }
          }
          n = 2;
          scores = tempMam;
        }

        mam = scores.reduce(function(a, b) {
          return a + b
        })
        mam = Math.roundTo(mam / n, 4);

        scores = [];
        n = [];

        n = Object.keys(data.h)
        for (var i = 0; i < n.length; i++) {
          few = few + (data.h[n[i]].few || 0);
          spc = spc + (data.h[n[i]].spc || 0);
          tim = tim + (data.h[n[i]].tim ? 1 : 0);
        }
        few = few / n.length;
        spc = spc / n.length;
        tim = Math.round(tim / n.length);

        mim = mim + spc;
        mam = mam + tim + few;

        T5 = Math.roundTo((mim * 12.5) + (mam * 25), 4)

        A = ((T1 - (T5 / 2)) + (T4 - (T5 / 2))) * fac;
        A = (A < 0 ? 0 : A)

        console.log("id:", uid, "event:", event, "T1:", T1, "T2:", T2,
          "T3:", T3, "T4:", T4,
          "T5:",
          T5, "multiplied:", A)

        if (!$scope.data[$scope.id].finalscores) {
          $scope.data[$scope.id].finalscores = {};
        }
        if (!$scope.data[$scope.id].finalscores[uid]) {
          $scope.data[$scope.id].finalscores[uid] = {};
        }
        if (!$scope.data[$scope.id].finalscores[uid][event]) {
          $scope.data[$scope.id].finalscores[uid][event] = {};
        }

        $scope.data[$scope.id].finalscores[uid][event].total = A;
        $scope.data[$scope.id].finalscores[uid][event].crea = (T4 - (T5 /
          2));
        $scope.data[$scope.id].finalscores[uid][event].diff = (T1 - (T5 /
          2));
        return Math.roundTo(A, 2);
      }
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
        if (event == "ranksum" && ((Object.keys(data[uid])
            .length - 1) != enabled)) {
          return undefined;
        }

        var keys = Object.keys(data);
        var scores = [];
        var score = (data[uid] ? data[uid][event] || 0 : 0);
        var rank;
        var fac = 1;

        for (var i = 0; i < keys.length; i++) {
          if (event == "ranksum" && ((Object.keys(data[keys[i]])
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

        if ($scope.data[$scope.id].config.simplified &&
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
        var Cscore = (data[uid] && data[uid][event] ? data[uid][event].crea ||
          0 : 0);
        var Dscore = (data[uid] && data[uid][event] ? data[uid][event].diff ||
          0 : 0);
        var fac = 1;

        for (var i = 0; i < keys.length; i++) {
          if (data[keys[i]][event]) {
            Cscores.push(data[keys[i]][event].crea || 0)
            Dscores.push(data[keys[i]][event].diff || 0)
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
          var CtempScore = (data[keys[i]] && data[keys[i]][event] ? data[[
              keys[i]]]
              [event].crea ||
            0 : 0)
          var DtempScore = (data[keys[i]] && data[keys[i]][event] ? data[[
              keys[i]]]
              [event].diff ||
            0 : 0)
          var CtempRank = (CtempScore != undefined ? Cscores.indexOf(
              CtempScore) + 1 :
            undefined)
          var DtempRank = (DtempScore != undefined ? Dscores.indexOf(
              DtempScore) + 1 :
            undefined)
          if (DtempRank > 0 && CtempRank > 0) {
            var tempRanksum = Number(CtempRank) + Number(DtempRank);
            ranksums.push(tempRanksum)
          }
        }

        ranksums.sort(function(a, b) {
          return a - b; // sort ascending
        })

        rank = (ranksum != undefined ? ranksums.indexOf(ranksum) + 1 :
          undefined)

        if ($scope.data[$scope.id].config.simplified &&
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
        if (keys.length - subt == enabled) {
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
        if (keys.length - subt == enabled) {
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
  })
