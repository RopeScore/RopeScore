'use strict';
/**
 * @class jumpscore.results
 * @memberOf jumpscore
 * @requires ngRoute
 */
angular.module('jumpscore.results', ['ngRoute'])

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
   * @class jumpscore.results.ResultsCtrl
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

    $scope.score = function(event, data, uid) {
      if (Abbr.isSpeed(event) && data) {
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

        //console.log(T, W, Y)

        if (!$scope.data[$scope.id].finalscores) {
          $scope.data[$scope.id].finalscores = {};
        }
        if (!$scope.data[$scope.id].finalscores[uid]) {
          $scope.data[$scope.id].finalscores[uid] = {};
        }

        $scope.data[$scope.id].finalscores[uid][event] = Y;
        return Math.roundTo(Y, 2);

      } else if (!Abbr.isSpeed(event) && data && data.a && data.b && data.d &&
        data.h) {
        var A = 0; // final score
        var T1 = 0; // diff score
        var T2 = 0; // dres score
        var T3 = 0; // reqi score
        var T4 = 0; // crea score
        var T5 = 0; // deductions
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


        /** Calc Points per level + rq */
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
        for (var i = 2; i <= lmax; i++) {
          lev[i] = Math.roundTo(l(i), 4)
        }

        /** calc T1 */
        n = Object.keys(data.d)
          .length;
        for (var i = 0; i < n; i++) {
          scores.push(data.d[i])
        }
        for (var i = 0; i < n; i++) {
          for (var p = 1; p < lmax; p++) {
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
        rem = n - 3;
        for (var i = 0; i < rem; i++) {
          if (i % 2 == 0) {
            calcdiff.shift()
          } else {
            calcdiff.pop()
          }
        }
        tempT = calcdiff.reduce(function(a, b) {
          return a + b
        })
        tempT = Math.roundTo(tempT / (rem < 0 ? 3 - rem : 3), 4);

        T1 = Math.roundTo(tempT * 2.5, 4)

        /** Calc T2 */
        tempT = 0;
        scores = [];

        n = Object.keys(data.a);
        for (var i = 0; i < n.length; i++) {
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
        rem = n - 3;
        for (var i = 0; i < rem; i++) {
          if (i % 2 == 0) {
            calcpres.shift()
          } else {
            calcpres.pop()
          }
        }
        tempT = calcpres.reduce(function(a, b) {
          return a + b
        })
        tempT = Math.roundTo(tempT / (rem < 0 ? 3 - rem : 3), 4);
        T2 = Math.roundTo((tempT > 40 ? 200 : tempT * 5), 4)

        /** Calc T3 */
        tempT = 0;
        scores = [];

        n = Object.keys(data.b);
        for (var i = 0; i < n.length; i++) {
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
        rem = n - 3;
        for (var i = 0; i < rem; i++) {
          if (i % 2 == 0) {
            calcrq.shift()
          } else {
            calcrq.pop()
          }
        }
        tempT = calcrq.reduce(function(a, b) {
          return a + b
        })
        tempT = Math.roundTo(tempT / (rem < 0 ? 3 - rem : 3), 4);
        T3 = Math.roundTo((tempT * rq > 50 ? 50 : tempT * rq), 4)

        /** Calc T4 */
        T4 = T2 + T3;

        /** Calc T5 */
        tempT = 0;
        scores = [];

        n = Object.keys(data.mim);
        for (var i = 0; i < n.length; i++) {
          scores.push(data.mim[n[i]])
        }
        scores.sort(function(a, b) {
          return a - b
        })
        rem = n.length - 7;
        for (var i = 0; i < rem; i++) {
          if (i % 2 == 0) {
            scores.shift()
          } else {
            scores.pop()
          }
        }
        mim = scores.reduce(function(a, b) {
          return a + b
        })
        mim = Math.roundTo(mim / (rem < 0 ? 7 - rem : 7), 4);

        scores = [];

        n = Object.keys(data.mam);
        for (var i = 0; i < n.length; i++) {
          scores.push(data.mam[n[i]])
        }
        scores.sort(function(a, b) {
          return a - b
        })
        rem = n.length - 7;
        for (var i = 0; i < rem; i++) {
          if (i % 2 == 0) {
            scores.shift()
          } else {
            scores.pop()
          }
        }
        mam = scores.reduce(function(a, b) {
          return a + b
        })
        mam = Math.roundTo(mam / (rem < 0 ? 7 - rem : 7), 4);

        scores = [];
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

        //console.log(T1, T2, T3, T4, T5, A)

        if (!$scope.data[$scope.id].finalscores) {
          $scope.data[$scope.id].finalscores = {};
        }
        if (!$scope.data[$scope.id].finalscores[uid]) {
          $scope.data[$scope.id].finalscores[uid] = {};
        }

        $scope.data[$scope.id].finalscores[uid][event] = A;
        return Math.roundTo(A, 2);
      }
    }

    $scope.rank = function(data, event, uid) {
      if (data) {
        var keys = Object.keys(data);
        var scores = [];
        var score = (data[uid] ? data[uid][event] || 0 : 0);
        for (var i = 0; i < keys.length; i++) {
          scores.push(data[keys[i]][event] || undefined)
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
        var rank = (score ? scores.indexOf(score) + 1 : '')

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
        var total = 0;
        data.final = undefined;
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          total = total + (data[keys[i]] || 0);
        }
        data.final = total;
        return Math.roundTo(total, 2);
      }
    }

    $scope.ranksum = function(data) {
      if (data) {
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
  })
