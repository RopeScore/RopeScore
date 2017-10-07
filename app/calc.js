/* global angular */
angular.module('Calc', [])
  .factory('Calc', function (Abbr, Db, Config) {
    var methods = {
      speed: function (event, data) {
        if (typeof data.s === 'undefined') {
          return undefined
        }
        var scores = []
        var output = {
          T: 0,
          W: 0,
          Y: 0,
          PreY: 0
        }
        var diff
        var i

        for (i = 0; i < Object.keys(data.s)
          .length; i++) {
          scores.push(data.s[i])
          if (!data.s[i] || data.s[i] < 0) {
            return undefined
          }
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
        if (scores.length === 1) {
          output.T = scores[0]
        }

        if (data.start) {
          output.W += 5
        }
        if (data.switches) {
          output.W += 5 * (data.switches > 3 ? 3 : data.switches)
        }

        output.PreY = output.T - output.W

        output.Y = output.PreY * methods.speedFactor(event)

        return output
      },
      freestyle: {
        T1: function (data, ld, simplified) { // Difficulty, data.d
          if (typeof data === 'undefined') {
            return undefined
          }

          if (typeof ld === 'string') {
            ld = methods.levelData(ld, simplified)
          }
          console.log(ld)

          var i
          var calcdiff = []
          var scores = []
          var keys = Object.keys(data)
          var n = keys.length

          for (i = keys[0]; i <= keys[keys.length - 1]; i++) {
            scores.push(data[i])
          }

          for (i = 0; i < n; i++) {
            if (typeof calcdiff[i] === 'undefined') {
              calcdiff[i] = {}
            }
            for (var p = ld.lmax - 1; p >= ld.lmin - 1; p--) {
              if (typeof calcdiff[i][p] === 'undefined') {
                calcdiff[i][p] = 0
              }

              calcdiff[i][p] += Math.roundTo((scores[i][p] || 0) * ld.lev[p], 4)

              if (ld.lmaxes[p] !== -1 && calcdiff[i][p] > ld.lmaxes[p]) {
                var temp = calcdiff[i][p] - ld.lmaxes[p] || 0
                calcdiff[i][p] = ld.lmaxes[p]
                calcdiff[i][p - 1] = temp
              }
            }
            temp = Object.keys(calcdiff[i])
              .reduce(function (a, b) {
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
          }

          var tempT = calcdiff.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)

          return Math.roundTo(tempT * 2.5, 4)
        },
        T2: function (event, data, simplified) { // Presentation, data.a
          if (typeof data === 'undefined') {
            return undefined
          }

          var order = Config.Order

          var keys = Object.keys(data)
          var n = keys.length
          var scores = []
          var i
          var calcpres = []

          for (i = keys[0]; i <= keys[keys.length - 1]; i++) {
            scores.push(data[i])
          }

          for (i = 0; i < scores.length; i++) {
            if (typeof calcpres[i] === 'undefined') {
              calcpres[i] = 0
            }
            var type, j, weight
            if (Abbr.isType(event, 'sr')) {
              type = 'sr'
            } else {
              type = 'dd'
            }
            keys = Object.keys(scores[i])
            for (j = 0; j < keys.length; j++) {
              weight = (simplified && order.a[keys[j]].simplWeight ? order.a[keys[j]].simplWeight[type] || order.a[keys[j]].weight[type] : order.a[keys[j]].weight[type])
              calcpres[i] += scores[i][keys[j]] * weight
            }
          }
          calcpres.sort(function (a, b) {
            return a - b
          })

          if (n >= 4) {
            calcpres.shift()
            calcpres.pop()
            n = n - 2
          }

          var tempT = calcpres.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)
          return Math.roundTo((tempT > 40 ? 40 * 5 : tempT * 5), 4)
        },
        T3: function (data, rq, simplified) { // Required Elements, data.b
          if (typeof data === 'undefined') {
            return undefined
          }

          if (isNaN(Number(rq))) {
            rq = methods.levelData(rq, simplified)
              .rq
          }

          var keys = Object.keys(data)
          var n = keys.length
          var i
          var scores = []
          var calcrq = []

          for (i = Number(keys[0]); i <= Number(keys[keys.length - 1]); i++) {
            scores.push(data[i])
          }

          for (i = 0; i < scores.length; i++) {
            if (typeof scores[i] === 'undefined') {
              calcrq[i] = 0
              continue
            }
            keys = Object.keys(scores[i])
            for (var p = 0; p < keys.length; p++) {
              if (!calcrq[i]) {
                calcrq[i] = 0
              }
              calcrq[i] = calcrq[i] + (scores[i][keys[p]] || 0)
            }
          }
          calcrq.sort(function (a, b) {
            return a - b
          })

          if (n >= 4) {
            calcrq.shift()
            calcrq.pop()
            n = n - 2
          }

          var tempT = calcrq.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)
          return Math.roundTo((tempT * rq > 50 ? 50 : tempT * rq), 4)
        },
        T4: function (T2, T3) { // Creativity
          // if (typeof T2 === 'undefined' && typeof T3 === 'undefined') {
          //   return undefined
          // }

          return Math.roundTo(Number(T2) || 0 + Number(T3) || 0, 4)
        },
        T5: function (data, forceNum) { // Deductions, data
          if (typeof data === 'undefined' || typeof data.mim ===
            'undefined' || typeof data.mam === 'undefined' || typeof data
            .h === 'undefined') {
            return (forceNum ? 0 : undefined)
          }

          var i
          var n = 0
          var keys = []
          var scores = []
          var miss = 0
          var few = 0
          var spc = 0
          var tim = 0

          keys = Object.keys(data.mim)
          n = keys.length

          for (i = 0; i < n; i++) {
            scores.push((data.mim[keys[i]] * 12.5) + (data.mam[keys[i]] * 25))
          }
          scores.sort(function (a, b) {
            return a - b
          })

          if (n >= 4) {
            scores.shift()
            scores.pop()
            n = n - 2
          }

          miss = scores.reduce(function (a, b) {
            return a + b
          })
          miss = Math.roundTo(miss / n, 4)

          scores = []
          keys = []

          keys = Object.keys(data.h)
          n = keys.length
          for (i = 0; i < n; i++) {
            few = few + (data.h[keys[i]].few || 0)
            spc = spc + (data.h[keys[i]].spc || 0)
            tim = tim + (data.h[keys[i]].tim ? 1 : 0)
          }
          few = Math.roundTo(few / n, 4)
          spc = Math.roundTo(spc / n, 4)
          tim = Math.roundTo(tim / n, 4)

          miss = miss + (spc * 12.5)
          miss = miss + ((tim + few) * 25)

          return Math.roundTo(miss, 4)
        },
        A: function (T1, T4, T5, ld, simplified) {
          if (typeof ld === 'string') {
            ld = methods.levelData(ld, simplified)
          }
          var output = {}

          output.PreA = T1 + T4 - T5 // equal to (T1 - (T5/2)) + (T4 - (T5/2))
          output.A = output.PreA * ld.fac
          // output.A = (output.A < 0 ? 0 : output.A)
          // output.PreA = (output.PreA < 0 ? 0 : output.PreA)
          output.PreA = Math.roundTo(output.PreA, 4)
          output.A = Math.roundTo(output.A, 4)

          return output
        }
      },
      levelData: function (event, simplified) {
        var output = {
          lev: {},
          fac: 1
        }

        if (simplified) {
          output = Config.functions.simplifiedLevelData(event) || {}
          output.lev = {}
          output.fac = 1
        } else {
          output.lmaxes = {
            '0': -1,
            '1': 10,
            '2': 20,
            '3': 30,
            '4': -1,
            '5': -1
          }
          output.lmin = 2
          if (event === 'srsf') {
            output.l = function (x) {
              return (3 / (Math.pow(1.5, (6 - x))))
            }
            output.lmax = 6
            output.rq = 50 / 14
            output.fac = 2
          } else if (event === 'srpf' || event === 'srtf') {
            output.l = function (x) {
              return (3.5 / (Math.pow(1.5, (5 - x))))
            }
            output.lmax = 6
            output.rq = 50 / 16
          } else if (event === 'ddsf' || event === 'ddpf') {
            output.l = function (x) {
              return (3 / (Math.pow(1.5, (5 - x))))
            }
            output.lmax = 5
            output.rq = 50 / 16
          }
        }

        for (var i = output.lmin - 1; i < output.lmax; i++) {
          // lev[i] = Math.roundTo(l(i + 1), 4)
          output.lev[i] = output.l(i + 1)
        }

        output.order = Config.Order

        return output
      },
      score: function (event, data, uid, simplified) {
        var output = {
          T: 0,
          W: 0,
          PreY: 0,
          Y: 0
        }

        if (Abbr.isSpeed(event) && data && data.s) {
          output = methods.speed(event, data)

          if (typeof output === 'undefined') {
            return undefined
          }

          console.log('uid:', uid, 'event:', event, 'T:', output.T, 'W:',
            output.W, 'PreY:', output.PreY, 'Y:', output.Y)

          return output
        } else if (!Abbr.isSpeed(event) && data) { // && data.a && data.b && data.d && data.h) {
          output = {
            A: 0, // final score
            PreA: 0, // unmultiplied final score
            T1: 0, // diff score
            T2: 0, // pres score
            T3: 0, // req score
            T4: 0, // crea score
            T5: 0 // deductions
          }

          /** Calc Points per level, rq and max points per level */
          var levelData = methods.levelData(event, simplified)

          /** calc T1 */
          output.T1 = methods.freestyle.T1(data.d, levelData)

          /** Calc T2 */
          output.T2 = methods.freestyle.T2(event, data.a, simplified)

          /** Calc T3 */
          output.T3 = methods.freestyle.T3(data.b, levelData.rq)

          /** Calc T4 */
          output.T4 = methods.freestyle.T4(output.T2, output.T3)

          /** Calc T5 */
          var T1type = typeof output.T1
          var T4type = typeof output.T4
          output.T5 = methods.freestyle.T5(data, (T1type !== 'undefined' || T4type !== 'undefined'))

          /** Calc A */
          var Aoutput = methods.freestyle.A(output.T1, output.T4, output.T5,
            levelData)
          output.PreA = Aoutput.PreA
          output.A = Aoutput.A

          console.log('uid:', uid, 'event:', event, 'T1:', output.T1,
            'T2:', output.T2, 'T3:', output.T3, 'T4:', output.T4,
            'T5:', output.T5, 'final:', output.PreA, 'multiplied:',
            output.A)

          return output
        }
      },
      finalscore: function (data, subevents, rankAll, uid) {
        if (data) {
          var keys = Object.keys(data)
            .filter(function (abbr) {
              return Abbr.events().indexOf(abbr) >= 0 && typeof data[abbr] !== 'undefined' && Object.keys(data[abbr]).length !== 0
            })
          if (typeof subevents === 'undefined') return undefined
          var events = Object.keys(subevents)
          var enabled = events.filter(function (abbr) {
            return subevents[abbr]
          })
          var i
          var total

          if (rankAll || keys.length === enabled.length) {
            total = 0
            for (i = 0; i < keys.length; i++) {
              if (Abbr.isSpeed(keys[i]) && typeof data[keys[i]] !==
                'undefined') {
                total += Number(data[keys[i]].Y || 0) || 0
              } else if (typeof data[keys[i]] !== 'undefined') {
                total += Number(data[keys[i]].A || 0) || 0
              }
            }
            return total
          }
        }
      },
      rank: {
        speed: function (data, event, config, rankAll, participants) {
          if (typeof data === 'undefined') {
            return undefined
          }
          var keys
          var scores = []
          var fac = 1
          var ranks = {}
          var i

          if (rankAll) {
            keys = Object.keys(participants)
          } else {
            keys = Object.keys(data)
          }

          for (i = 0; i < keys.length; i++) {
            if (typeof data[keys[i]] !== 'undefined' && typeof data[keys[i]][event] !== 'undefined' && Object.keys(data[keys[i]][event]).length > 0 && data[keys[i]][event].dns !== true) {
              scores.push({
                uid: keys[i],
                score: data[keys[i]][event].Y || 0
              })
            } else if (rankAll) {
              scores.push({
                uid: keys[i],
                score: -1
              })
            }
          }

          scores.sort(function (a, b) {
            return b.score - a.score // sort descending
          })

          if ((config.simplified || config.showFactors) &&
            config.factors && config.factors[event]) {
            fac = config.factors[event]
          }

          for (i = 0; i < scores.length; i++) {
            var tRank = (scores.findIndex(function (obj) {
              return obj.score === scores[i].score
            }) + 1)
            ranks[scores[i].uid] = {
              rank: tRank,
              mult: tRank * fac
            }
          }

          return ranks
        },
        freestyle: function (data, event, config, rankAll, participants) {
          var keys
          var Cscores = []
          var Dscores = []
          // var Tscores = {}
          var ranksums = []
          var fac = 1
          var ranks = {}
          var i

          if (rankAll) {
            keys = Object.keys(participants)
          } else {
            keys = Object.keys(data)
          }

          for (i = 0; i < keys.length; i++) {
            if (data[keys[i]][event] && Object.keys(data[keys[i]][event]).length !== 0 && data[keys[i]][event].dns !== true) {
              Cscores.push(data[keys[i]][event].T4 - (data[keys[i]][event]
                .T5 / 2) || 0)
              Dscores.push(data[keys[i]][event].T1 - (data[keys[i]][event]
                .T5 / 2) || 0)
              // Tscores[keys[i]] = data[keys[i]][event].A
            } else if (rankAll) {
              Cscores.push(-Infinity)
              Dscores.push(-Infinity)
            }
          }
          Cscores.sort(function (a, b) {
            return b - a // sort descending
          })
          Dscores.sort(function (a, b) {
            return b - a // sort descending
          })

          // calc everyones Crank and Drank and push sum into an array
          for (i = 0; i < keys.length; i++) {
            var CtempScore = (data[keys[i]] && data[keys[i]][event] ? data[keys[i]][event].T4 - (data[keys[i]][event].T5 / 2) || 0 : -Infinity)
            var DtempScore = (data[keys[i]] && data[keys[i]][event] ? data[keys[i]][event].T1 - (data[keys[i]][event].T5 / 2) || 0 : -Infinity)
            var TtempScore = (data[keys[i]] && data[keys[i]][event] ? data[keys[i]][event].A || 0 : -Infinity)
            var CtempRank = (typeof CtempScore !== 'undefined' ? Cscores.indexOf(CtempScore) + 1 : undefined)
            var DtempRank = (typeof DtempScore !== 'undefined' ? Dscores.indexOf(DtempScore) + 1 : undefined)
            if (DtempRank > 0 && CtempRank > 0) {
              if (typeof ranks[keys[i]] === 'undefined') {
                ranks[keys[i]] = {}
              }
              ranks[keys[i]].crea = CtempRank
              ranks[keys[i]].diff = DtempRank
              var tempRanksum = Number(CtempRank) + Number(DtempRank)
              ranksums.push({
                ranksum: tempRanksum,
                score: TtempScore,
                uid: keys[i]
              })
            }
          }

          ranksums.sort(function (a, b) {
            // sort ascending on rank but descending on score if ranksums are equal
            if (a.ranksum === b.ranksum) {
              return b.score - a.score
            } else {
              return a.ranksum - b.ranksum
            }
          })

          if ((config.simplified || config.showFactors) && config.factors &&
            config.factors[event]) {
            fac = config.factors[event] || 1
          } else if (event === 'srsf') {
            fac = 2
          }

          for (i = 0; i < ranksums.length; i++) {
            var tRank = (ranksums.findIndex(function (obj) {
              if (rankAll && ranksums[i].score === -Infinity) {
                return obj.ranksum === ranksums[i].ranksum
              }
              return obj.uid === ranksums[i].uid
            }) + 1)
            ranks[ranksums[i].uid].total = {
              rank: tRank,
              mult: tRank * fac
            }
          }

          return ranks
        },
        overall: function (data) {
          var output = {}
          var ranksums = Object.keys(data)
            .map(function (uid) {
              return {
                uid: uid,
                ranksum: data[uid]
              }
            })

          ranksums.sort(function (a, b) {
            return a.ranksum - b.ranksum
          })
          for (var i = 0; i < ranksums.length; i++) {
            output[ranksums[i].uid] = ranksums.findIndex(function (obj) {
              return obj.ranksum === ranksums[i].ranksum
            }) + 1
          }

          return output
        },
        sum: function (arr, finalscores, subevents) {
          var output = {}
          for (var i = 0; i < arr.length; i++) {
            if (typeof finalscores[arr[i].uid].final === 'undefined') {
              continue
            }
            var sum = Object.keys(arr[i])
              .filter(function (abbr) {
                return Abbr.events().indexOf(abbr) >= 0
              })
              .filter(function (abbr) {
                return typeof subevents[abbr] !== 'undefined' && subevents[abbr] === true
              })
              .reduce(function (sum, abbr) {
                if (typeof arr[i][abbr] === 'undefined') {
                  return sum
                }
                return Number(sum) + Number(arr[i][abbr].mult)
              }, 0)
            output[arr[i].uid] = sum
          }
          return output
        }
      },
      speedFactor: function (event) {
        if (event === 'srss') {
          return 5
        } else if (event === 'srsr') {
          return 3
        } else if (event === 'ddsr') {
          return 2
        }
        return 1
      },
      inAll: function (enabled, partook) {
        var inAll = false
        if (typeof partook === 'undefined') return inAll
        var eKeys = Object.keys(enabled)
          .filter(function (abbr) {
            return enabled[abbr]
          })
        var pKeys = Object.keys(partook)
          .filter(function (abbr) {
            if (typeof partook[abbr] === 'undefined') {
              return false
            }
            if (partook[abbr].dns === true) {
              return false
            }
            return true
          })

        if (eKeys.length === pKeys.length) {
          inAll = true
        }

        return inAll
      },
      clearData: function (id, scope) {
        delete scope.data[id].finalscores
      }
    }
    return methods
  })
