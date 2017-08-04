/* global angular */
angular.module('Calc', [])
  .factory('Calc', function (Abbr, Db, Config) {
    var methods = {
      score: function (event, data, uid, id, ret, scope) {
        if (typeof ret === 'object') {
          scope = ret
          ret = undefined
        }
        var output
        var diff
        var scores
        var i
        if (Abbr.isSpeed(event) && data && data.s) {
          scores = []
          output = {
            T: 0,
            W: 0,
            Y: 0,
            PreY: 0
          }
          diff = undefined

          for (i = 0; i < Object.keys(data.s)
            .length; i++) {
            scores.push(data.s[i])
          }
          scores = scores.sort(function (a, b) {
            return a - b
          })
          for (i = 1; i < scores.length; i++) {
            var cdiff = Math.abs(scores[i] - scores[i - 1])
            if (typeof diff === 'undefined' || cdiff <= diff) {
              diff = cdiff
              output.T = (scores[i] + scores[i - 1]) / 2
            }
          }

          if (data.start) {
            output.W += 5
          }
          if (data.switches) {
            output.W += 5 * (data.switches > 3 ? 3 : data.switches)
          }

          output.PreY = output.T - output.W

          output.Y = output.PreY * methods.speedFactor(event)

          console.log('id:', uid, 'event:', event, 'T:', output.T, 'W:',
            output.W,
            'preY:',
            output.PreY, 'Y:', output.Y)

          if (!scope.data[id].finalscores) {
            scope.data[id].finalscores = {}
          }
          if (!scope.data[id].finalscores[uid]) {
            scope.data[id].finalscores[uid] = {}
          }

          scope.data[id].finalscores[uid][event] = output.Y
          if (Config.ShowRaw) {
            return Math.roundTo(output[ret] || output.PreY, 2)
          }
          return Math.roundTo(output[ret] || output.Y, 2)
        } else if (!Abbr.isSpeed(event) && data && data.a && data.b &&
          data
          .d && data.h) {
          output = {
            A: 0, // final score
            PreA: 0, // unmultiplied final score
            T1: 0, // diff score
            T2: 0, // pres score
            T3: 0, // req score
            T4: 0, // crea score
            T5: 0 // deductions
          }
          var keys = []
          var tempT = 0
          diff = undefined
          var mim = 0
          var mam = 0
          var tim = 0
          var spc = 0
          var few = 0
          var n = 0
          var fac = 1
          scores = []
          var calcdiff = []
          var calcpres = []
          var calcrq = []
          var lev = {}
          var l
          var rq
          var lmax
          var lmin

          /** Calc Points per level, rq and max points per level */
          if (scope.data[id].config.simplified) {
            var lmaxes = {
              '0': 10,
              '1': 20,
              '2': 30,
              '3': -1,
              '4': -1,
              '5': -1
            }
            lmin = 1
            if (event === 'srsf') {
              l = function (x) {
                return (3 / (Math.pow(1.5, (5 - x))))
              }
              lmax = 6
              rq = 50 / 14
              fac = 2
            } else if (event === 'srpf' || event === 'srtf') {
              l = function (x) {
                return (3.5 / (Math.pow(1.5, (4 - x))))
              }
              lmax = 6
              rq = 50 / 16
            } else if (event === 'ddsf' || event === 'ddpf') {
              l = function (x) {
                return (3 / (Math.pow(1.5, (4 - x))))
              }
              lmax = 5
              rq = 50 / 16
            }
          } else {
            var lmaxes = {
              '0': -1,
              '1': 10,
              '2': 20,
              '3': 30,
              '4': -1,
              '5': -1
            }
            lmin = 2
            if (event === 'srsf') {
              l = function (x) {
                return (3 / (Math.pow(1.5, (6 - x))))
              }
              lmax = 6
              rq = 50 / 14
              fac = 2
            } else if (event === 'srpf' || event === 'srtf') {
              l = function (x) {
                return (3.5 / (Math.pow(1.5, (5 - x))))
              }
              lmax = 6
              rq = 50 / 16
            } else if (event === 'ddsf' || event === 'ddpf') {
              l = function (x) {
                return (3 / (Math.pow(1.5, (5 - x))))
              }
              lmax = 5
              rq = 50 / 16
            }
          }

          for (i = lmin - 1; i < lmax; i++) {
            // lev[i] = Math.roundTo(l(i + 1), 4)
            lev[i] = l(i + 1)
          }

          /** calc T1 */
          n = Object.keys(data.d)
            .length
          for (i = 0; i < n; i++) {
            scores.push(data.d[i])
          }
          for (i = 0; i < n; i++) {
            for (var p = lmin - 1; p < lmax; p++) {
              if (typeof calcdiff[i] === 'undefined') {
                calcdiff[i] = {}
              }
              calcdiff[i][p] = Math.roundTo((scores[i][p] || 0) * lev[p], 4)
              if (lmaxes[p] !== -1 && calcdiff[i][p] > lmaxes[p]) {
                var temp = calcdiff[i][p] - lmaxes[p] || 0
                calcdiff[i][p] = lmaxes[p]
                if (p >= lmin && temp > 0 && lmaxes[p - 1] !== -1 && calcdiff[i][p - 1] < lmaxes[p - 1]) {
                  // there is an excess of level 3 (4) skills for it'll be converted to 1.5 level 2 (3) skills
                  calcdiff[i][p - 1] = calcdiff[i][p - 1] + temp
                  calcdiff[i][p - 1] = (calcdiff[i][p - 1] > lmaxes[p - 1] ? lmaxes[p - 1] : calcdiff[i][p - 1])
                }
              }
            }
            temp = Object.keys(calcdiff[i]).reduce(function (a, b) {
              return Number(a) + Number(calcdiff[i][b])
            }, 0)
            calcdiff[i] = temp
            temp = undefined
          }
          calcdiff.sort(function (a, b) {
            return a - b
          })

          if (n >= 4) {
            calcdiff.shift()
            calcdiff.pop()
            n = n - 2
          } else if (n === 1) {} else if (n === 3) {
            /* var tempCalcdiff = []
            diff = undefined
            for (i = 1; i < n; i++) {
              var cdiff = Math.abs(calcdiff[i] - calcdiff[i - 1])
              if (typeof diff === 'undefined' || cdiff <= diff) {
                diff = cdiff
                tempCalcdiff = [calcdiff[i - 1], calcdiff[i]]
              }
            }
            n = 2
            calcdiff = tempCalcdiff */
          }

          tempT = calcdiff.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)

          output.T1 = Math.roundTo(tempT * 2.5, 4)

          /** Calc T2 */
          tempT = 0
          scores = []

          n = Object.keys(data.a)
            .length
          for (var i = 0; i < n; i++) {
            scores.push(data.a[i])
          }
          for (var i = 0; i < scores.length; i++) {
            if (typeof calcpres[i] === 'undefined') {
              calcpres[i] = 0
            }
            var keys = Object.keys(scores[i])
            // for (var p = 0; p < keys.length; p++) {
            //   calcpres[i] = calcpres[i] + (scores[i][keys[p]] || 0)
            //   if (calcpres[i] > 40) {
            //     calcpres[i] = 40
            //   }
            // }
            if (Abbr.isType(event, 'sr')) {
              calcpres[i] += (scores[i].mob + scores[i].uom) * 0.75
              calcpres[i] += scores[i].mov * 0.5
              calcpres[i] += scores[i].ori
              calcpres[i] += scores[i].fbe
            } else {
              calcpres[i] += (scores[i].mob + scores[i].uom) * 0.75
              calcpres[i] += scores[i].fbe * 0.75
              calcpres[i] += scores[i].mov * 0.5
              calcpres[i] += scores[i].int * 0.5
              calcpres[i] += scores[i].ori * 0.75
            }
          }
          calcpres.sort(function (a, b) {
            return a - b
          })

          if (n >= 4) {
            calcpres.shift()
            calcpres.pop()
            n = n - 2
          } else if (n === 1) {} else if (n === 3) {
            /* var tempCalcpres = []
            var diff
            for (var i = 1; i < n; i++) {
              var cdiff = Math.abs(calcpres[i] - calcpres[i - 1])
              if (typeof diff === 'undefined' || cdiff <= diff) {
                diff = cdiff
                tempCalcpres = [calcpres[i - 1], calcpres[i]]
              }
            }
            n = 2
            calcpres = tempCalcpres */
          }

          tempT = calcpres.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)
          output.T2 = Math.roundTo((tempT > 40 ? 40 * 5 : tempT * 5), 4)

          /** Calc T3 */
          tempT = 0
          scores = []

          n = Object.keys(data.b)
            .length
          for (var i = 0; i < n; i++) {
            scores.push(data.b[i])
          }
          for (var i = 0; i < scores.length; i++) {
            var keys = Object.keys(scores[i])
            for (var p = 0; p < keys.length; p++) {
              if (!calcrq[i]) {
                calcrq[i] = 0
              }
              calcrq[i] = calcrq[i] + (scores[i][keys[p]] || 0)
            }
            if (typeof scores[i].pai !== 'undefined' && scores[i].pai < 2) {
              calcrq[i] = calcrq[i] - scores[i].pai
            }
            if (typeof scores[i].jis !== 'undefined' && scores[i].jis < 2) {
              calcrq[i] = calcrq[i] - scores[i].jis
            }
          }
          calcrq.sort(function (a, b) {
            return a - b
          })

          if (n >= 4) {
            calcrq.shift()
            calcrq.pop()
            n = n - 2
          } else if (n === 1) {} else if (n === 3) {
            /* var tempCalcrq = []
            var diff
            for (var i = 1; i < n; i++) {
              var cdiff = Math.abs(calcrq[i] - calcrq[i - 1])
              if (typeof diff === 'undefined' || cdiff <= diff) {
                diff = cdiff
                tempCalcrq = [calcrq[i - 1], calcrq[i]]
              }
            }
            n = 2
            calcrq = tempCalcrq */
          }

          tempT = calcrq.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)
          output.T3 = Math.roundTo((tempT * rq > 50 ? 50 : tempT * rq),
            4)

          /** Calc T4 */
          output.T4 = Math.roundTo(output.T2 + output.T3, 4)

          /** Calc T5 */
          tempT = 0
          scores = []

          n = Object.keys(data.mim)
            .length
          keys = Object.keys(data.mim)
          for (var i = 0; i < n; i++) {
            scores.push((data.mim[keys[i]] * 12.5) + (data.mam[keys[i]] * 25))
          }
          scores.sort(function (a, b) {
            return a - b
          })

          if (n >= 4) {
            scores.shift()
            scores.pop()
            n = n - 2
          } else if (n === 1) {} else if (n === 3) {
            // var tempmiss = []
            // var diff
            // for (var i = 1; i < n; i++) {
            //   var cdiff = Math.abs(scores[i] - scores[i - 1])
            //   if (typeof diff === 'undefined' || cdiff <= diff) {
            //     diff = cdiff
            //     tempMiss = [scores[i - 1], scores[i]]
            //   }
            // }
            // n = 2
            // scores = tempMiss
          }

          miss = scores.reduce(function (a, b) {
            return a + b
          })
          miss = Math.roundTo(miss / n, 4)

          // scores = []
          // n = 0
          // keys = []
          //
          // n = Object.keys(data.mam)
          //   .length
          // keys = Object.keys(data.mam)
          // for (var i = 0; i < n; i++) {
          //   scores.push(data.mam[keys[i]])
          // }
          // scores.sort(function (a, b) {
          //   return a - b
          // })
          //
          // if (n >= 4) {
          //   scores.shift()
          //   scores.pop()
          //   n = n - 2
          // } else if (n == 1) {} else if (n == 3) {
          //   var tempMam = []
          //   var diff
          //   for (var i = 1; i < n; i++) {
          //     var cdiff = Math.abs(scores[i] - scores[i - 1])
          //     if (typeof diff === 'undefined' || cdiff <= diff) {
          //       diff = cdiff
          //       tempMam = [scores[i - 1], scores[i]]
          //     }
          //   }
          //   n = 2
          //   scores = tempMam
          // }
          //
          // mam = scores.reduce(function (a, b) {
          //   return a + b
          // })
          // mam = Math.roundTo(mam / n, 4)

          scores = []
          n = []

          n = Object.keys(data.h)
          for (var i = 0; i < n.length; i++) {
            few = few + (data.h[n[i]].few || 0)
            spc = spc + (data.h[n[i]].spc || 0)
            tim = tim + (data.h[n[i]].tim ? 1 : 0)
          }
          few = few / n.length
          spc = spc / n.length
          tim = Math.round(tim / n.length)

          miss = miss + (spc * 12.5)
          miss = miss + ((tim + few) * 25)

          output.T5 = Math.roundTo(miss, 4)

          /** Calc A */

          output.PreA = ((output.T1 - (output.T5 / 2)) + (output.T4 - (
            output.T5 /
            2)))
          output.A = output.PreA * fac
          // output.A = (output.A < 0 ? 0 : output.A)
          // output.PreA = (output.PreA < 0 ? 0 : output.PreA)
          output.preA = Math.roundTo(output.preA, 4)
          output.A = Math.roundTo(output.A, 4)

          console.log('id:', uid, 'event:', event, 'T1:', output.T1,
            'T2:', output.T2, 'T3:', output.T3, 'T4:', output.T4,
            'T5:', output.T5, 'final:', output.PreA, 'multiplied:',
            output.A)

          if (!scope.data[id].finalscores) {
            scope.data[id].finalscores = {}
          }
          if (!scope.data[id].finalscores[uid]) {
            scope.data[id].finalscores[uid] = {}
          }
          if (!scope.data[id].finalscores[uid][event]) {
            scope.data[id].finalscores[uid][event] = {}
          }

          scope.data[id].finalscores[uid][event].total = output.A
          scope.data[id].finalscores[uid][event].crea = output.T4
          scope.data[id].finalscores[uid][event].diff = output.T1
          scope.data[id].finalscores[uid][event].pres = output.T2
          scope.data[id].finalscores[uid][event].req = output.T3
          scope.data[id].finalscores[uid][event].deduc = output.T5
          return Math.roundTo(output[ret] || output.A, 2)
        }
      },
      speedFactor: function (event) {
        if (event == 'srss') {
          return 5
        } else if (event == 'srsr') {
          return 3
        } else if (event == 'ddsr') {
          return 2
        }
        return 1
      },
      clearData: function (id, scope) {
        delete scope.data[id].finalscores
      }
    }
    return methods
  })
