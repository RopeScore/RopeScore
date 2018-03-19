/* global angular */
angular.module('Calc', [])
  .factory('Calc', function (Abbr, Db, Config) {
    var methods = {
      /**
       * Calculate speed scores
       * @param  {String} event
       * @param  {Object} data
       * @return {?Object}
       */
      speed: function (event, data, simplified) {
        if (typeof data.s === 'undefined') {
          return undefined
        }
        var scores = []
        var output = {
          /** @type {Number} Raw score */
          T: 0,
          /** @type {Number} Deductions */
          W: 0,
          Y: 0,
          /** @type {Number} (Raw score - deductions) before multiplication */
          PreY: 0
        }
        var diff
        var i

        /* move all scores into an array */
        for (i = 0; i < Object.keys(data.s).length; i++) {
          scores.push(data.s[i])
          if (typeof data.s[i] === 'undefined' || data.s[i] < 0) {
            return undefined
          }
        }
        /* sort them ascending */
        scores = scores.sort(function (a, b) {
          return a - b
        })

        /* average the two closest scores */
        for (i = 1; i < scores.length; i++) {
          var cdiff = Math.abs(scores[i] - scores[i - 1])
          if (typeof diff === 'undefined' || cdiff <= diff) {
            diff = cdiff
            output.T = (scores[i] + scores[i - 1]) / 2
          }
        }
        /* special case if there's only one score entered */
        if (scores.length === 1) {
          output.T = scores[0]
        }

        /* deductions */
        if (data.start) {
          output.W += 5
        }
        if (data.switches) {
          output.W += 5 * (data.switches > 3 ? 3 : data.switches)
        }

        output.PreY = output.T - output.W

        output.PreY = (simplified && typeof Config.SimplMinScore !== 'undefined' && output.PreY < Config.SimplMinScore ? Config.SimplMinScore : output.PreY)

        output.Y = output.PreY * (simplified && Config.SimplRawSpeed ? 1 : Abbr.speedFactor(event))

        return output
      },
      freestyle: {
        /**
         * Diff score, T1
         * @param  {Object} data
         * @param  {Object|String} ld   levelData
         * @param  {Boolean} simplified if the event uses simplified rules
         * @return {?Number}
         */
        T1: function (data, ld, simplified) { // Difficulty, data.d
          if (typeof data === 'undefined') {
            return undefined
          }

          if (typeof ld === 'string') {
            ld = methods.levelData(ld, simplified)
          }

          var i
          var calcdiff = []
          var scores = []
          var keys = Object.keys(data)
          var n = keys.length

          for (i = keys[0]; i <= keys[keys.length - 1]; i++) {
            scores.push(data[i])
          }

          /* for every judge */
          for (i = 0; i < n; i++) {
            if (typeof calcdiff[i] === 'undefined') {
              calcdiff[i] = {}
            }
            /* for every level */
            for (var p = ld.lmax - 1; p >= ld.lmin - 1; p--) {
              if (typeof calcdiff[i][p] === 'undefined') {
                calcdiff[i][p] = 0
              }

              /* multiply entered ammount of skills by points per level */
              calcdiff[i][p] += Math.roundTo((Number(scores[i][p]) || 0) * ld.lev[p], 4)

              /* if level is capped, add to level below's score */
              if (ld.lmaxes[p] !== -1 && calcdiff[i][p] > ld.lmaxes[p]) {
                var temp = calcdiff[i][p] - ld.lmaxes[p] || 0
                calcdiff[i][p] = ld.lmaxes[p]
                if (p !== ld.lmin - 1) calcdiff[i][p - 1] = temp
              }
            }

            /* sum all level's scores for this judge */
            temp = Object.keys(calcdiff[i])
              .reduce(function (a, b) {
                return Number(a) + Number(calcdiff[i][b])
              }, 0)
            calcdiff[i] = temp
            temp = undefined
          }
          /* sort all the scores ascending */
          calcdiff.sort(function (a, b) {
            return a - b
          })

          /* drop highest and lowest scores if there are 4 or more judges */
          if (n >= 4 && !ld.noDrop) {
            calcdiff.shift()
            calcdiff.pop()
            n = n - 2
          }

          /* average the remaining judges scores */
          var tempT = calcdiff.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)

          var fac = (ld.freestyleFac && ld.freestyleFac.T1 ? ld.freestyleFac.T1 || 2.5 : 2.5)

          return Math.roundTo(tempT * fac, 4)
        },
        /**
         * Presentation score, T2
         * @param  {String} event
         * @param  {Object} data
         * @param  {Boolean} simplified if the event uses simplified rules
         * @return {?Number}
         */
        T2: function (event, data, simplified) { // Presentation, data.a
          if (typeof data === 'undefined') {
            return undefined
          }

          var order = (simplified ? Config.SimplOrder || Config.Order : Config.Order)
          var ld = methods.levelData(event, simplified)

          var keys = Object.keys(data)
          var n = keys.length
          var scores = []
          var i, type
          var calcpres = []

          if (Abbr.isType(event, 'sr')) {
            type = 'sr'
          } else {
            type = 'dd'
          }

          for (i = keys[0]; i <= keys[keys.length - 1]; i++) {
            scores.push(data[i])
          }

          for (i = 0; i < scores.length; i++) {
            if (typeof calcpres[i] === 'undefined') {
              calcpres[i] = 0
            }
            var j, weight
            keys = Object.keys(scores[i])
            for (j = 0; j < keys.length; j++) {
              /* multiply the scores by their weights */
              weight = (order.a[keys[j]] && order.a[keys[j]].weight ? order.a[keys[j]].weight[type] || 0 : 0)
              calcpres[i] += Number(scores[i][keys[j]]) * weight
            }
          }
          /* sort ascending */
          calcpres.sort(function (a, b) {
            return a - b
          })

          /* drop highest and lowest "if possible" */
          if (n >= 4 && !ld.noDrop) {
            calcpres.shift()
            calcpres.pop()
            n = n - 2
          }

          /* average the scores */
          var tempT = calcpres.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)

          var fac = (ld.freestyleFac && ld.freestyleFac.T2 ? ld.freestyleFac.T2 || 5 : 5)

          return Math.roundTo((tempT > 40 && !ld.noMaxes ? 40 * fac : tempT * fac), 4)
        },
        /**
         * Required Elements, T3
         * @param  {Object} data
         * @param  {Object} ld         levelData
         * @param  {Boolean} simplified if the event uses simplified rules
         * @return {?Numebr}
         */
        T3: function (data, ld, simplified) { // Required Elements, data.b
          if (typeof data === 'undefined') {
            return undefined
          }

          if (isNaN(Number(ld.rq))) {
            ld = methods.levelData(ld, simplified)
          }

          var keys = Object.keys(data)
          var n = keys.length
          var i
          var scores = []
          var calcrq = []

          for (i = Number(keys[0]); i <= Number(keys[keys.length - 1]); i++) {
            scores.push(data[i])
          }

          var isDD = (typeof ld.event !== 'undefined' ? Abbr.isType(ld.event, 'dd') : false)

          /* for every judge */
          for (i = 0; i < scores.length; i++) {
            if (typeof scores[i] === 'undefined') {
              calcrq[i] = 0
            }
            keys = Object.keys(scores[i])
            /* add all scores to calcrq[i], except turner involement skills.
            in double dutch speed dances and releases are worth 2 pts */
            for (var p = 0; p < keys.length; p++) {
              if (!calcrq[i]) {
                calcrq[i] = 0
              }
              if (keys[p] !== 'tis') calcrq[i] = Number(calcrq[i]) + ((Number(scores[i][keys[p]]) || 0) * (isDD && keys[p] === 'rel' ? 2 : 1))
            }
            /* aerials + not aereals = gymnastics which is max 3 */
            if (typeof scores[i].nae !== 'undefined' && typeof scores[i].aer !== 'undefined' && (Number(scores[i].nae) + Number(scores[i].aer)) > 3) calcrq[i] -= (Number(scores[i].nae) + Number(scores[i].aer)) - 3
            /* Max without turner involvement skills is 10 */
            if (isDD && calcrq[i] > ld.rqMax - 6) calcrq[i] = ld.rqMax - 6
            /* add turner involvement skills */
            if (isDD && typeof scores[i].tis !== 'undefined') calcrq[i] += Number(scores[i].tis)
            /* round to max */
            if (calcrq[i] > ld.rqMax) calcrq[i] = ld.rqMax
            /* deductions are made if less than 2 pairs interactions were made (pairs interaction - 2) */
            if (typeof scores[i].pai !== 'undefined' && scores[i].pai < 2) calcrq[i] -= -Number(scores[i].pai) + 2
          }
          /* sort ascending */
          calcrq.sort(function (a, b) {
            return a - b
          })

          /* drop highest and lowest scores 'if possible' */
          if (n >= 4) {
            calcrq.shift()
            calcrq.pop()
            n = n - 2
          }

          /* average scores */
          var tempT = calcrq.reduce(function (a, b) {
            return a + b
          })
          tempT = Math.roundTo(tempT / n, 4)
          return Math.roundTo((tempT * ld.rq > 50 ? 50 : tempT * ld.rq), 4)
        },
        /**
         * Total creativity score, Pres + Rq
         * @param  {?Number} T2 Presentation score
         * @param  {?Number} T3 Required Elements Score
         * @return {?Number}
         */
        T4: function (T2, T3) { // Creativity
          var T4 = (Number(T2) || 0) + (Number(T3) || 0)

          return Math.roundTo(T4 || 0, 4)
        },
        /**
         * Deductions (misses)
         * @param  {Object} data
         * @param  {Boolean} forceNum if true the function MUST return a number
         * @return {?Number}
         */
        T5: function (data, forceNum) { // Deductions, data
          if (typeof data === 'undefined') {
            return (forceNum ? 0 : undefined)
          }
          if (typeof data.mim === 'undefined') data.mim = {}
          if (typeof data.mam === 'undefined') data.mam = {}

          var i
          var n = 0
          var keys = []
          var keysMim = []
          var keysMam = []
          var scores = []
          var miss = 0
          var few = 0
          var spc = 0
          var tim = 0

          keysMim = Object.keys(data.mim)
          keysMam = Object.keys(data.mam)
          n = (keysMim.length > keysMam.length ? keysMim.length : keysMam.length)
          if (n > 0) {
            /* push every miss judges score to an array */
            for (i = 0; i < n; i++) {
              scores.push(((Number(data.mim[keysMim[i]]) || 0) * 12.5) + ((Number(data.mam[keysMam[i]]) || 0) * 25) || 0)
            }
            /* sort ascending */
            scores.sort(function (a, b) {
              return a - b
            })

            /* drop highest and lowest "if possible" */
            if (n >= 4) {
              scores.shift()
              scores.pop()
              n = n - 2
            }

            /* average */
            miss = scores.reduce(function (a, b) {
              return a + b
            })
            miss = Math.roundTo(miss / n, 4)
          }

          scores = []

          /* add Head judges deductions */
          if (typeof data.h !== 'undefined') {
            keys = Object.keys(data.h)
            n = keys.length
            for (i = 0; i < n; i++) {
              few += data.h[keys[i]].few || 0
              spc += data.h[keys[i]].spc || 0
              tim += (data.h[keys[i]].tim ? 1 : 0)
            }
            few = Math.roundTo(few / n, 4)
            spc = Math.roundTo(spc / n, 4)
            tim = Math.roundTo(tim / n, 4)

            miss += spc * 12.5
            miss += (tim + few) * 25
          }

          return Math.roundTo(miss, 4)
        },
        /**
         * Final score
         * @param  {?Number} T1         Diff score
         * @param  {?Number} T4         Crea score
         * @param  {?Number} T5         Deductions
         * @param  {Object} ld          levelData
         * @param  {Boolean} simplified if the event uses simplified rules
         * @return {?Number}
         */
        A: function (T1, T4, T5, ld, simplified) {
          if (typeof ld === 'string') {
            ld = methods.levelData(ld, simplified)
          }
          var output = {}

          output.PreA = T1 + T4 - T5 // equal to (T1 - (T5/2)) + (T4 - (T5/2))
          output.PreA = (simplified && typeof Config.SimplMinScore !== 'undefined' && output.PreA < Config.SimplMinScore ? Config.SimplMinScore : output.PreA)

          output.A = output.PreA * ld.fac
          output.PreA = Math.roundTo(output.PreA, 4)
          output.A = Math.roundTo(output.A, 4)

          return output
        }
      },
      /**
       * Object with level maxes, ponts per level, multiplication factors
       * @param  {String} event
       * @param  {Boolean} simplified if the event uses simplified rules
       * @return {Object}
       */
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
          output.event = event
          if (event === 'srsf') {
            output.l = function (x) {
              return (3 / (Math.pow(1.5, (6 - x))))
            }
            output.lmax = 6
            output.rqMax = 14
            output.fac = 2
          } else if (event === 'srpf' || event === 'srtf') {
            output.l = function (x) {
              return (3.5 / (Math.pow(1.5, (5 - x))))
            }
            output.lmax = 6
            output.rqMax = 16
          } else if (event === 'ddsf' || event === 'ddpf') {
            output.l = function (x) {
              return (3 / (Math.pow(1.5, (5 - x))))
            }
            output.lmax = 5
            output.rqMax = 16
          }
          output.rq = 50 / output.rqMax
        }

        for (var i = output.lmin - 1; i < output.lmax; i++) {
          // lev[i] = Math.roundTo(l(i + 1), 4)
          output.lev[i] = output.l(i + 1)
        }

        output.order = Config.Order

        return output
      },
      /**
       * Calculates the scores for a user for an event. Wrapper function
       * @param  {String} event
       * @param  {Object} data
       * @param  {String} uid         the participant's id
       * @param  {Boolean} simplified if the event uses simplified levels
       * @return {Object}             returns all the scores in an object
       */
      score: function (event, data, uid, simplified) {
        var output

        if (Abbr.isSpeed(event) && data && data.s) {
          output = {
            T: 0,
            W: 0,
            PreY: 0,
            Y: 0
          }
          output = methods.speed(event, data, simplified)

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
          output.T3 = methods.freestyle.T3(data.b, levelData)

          /** Calc T4 */
          output.T4 = methods.freestyle.T4(output.T2, output.T3)

          /** Calc T5 */
          var T1type = typeof output.T1
          var T4type = typeof output.T4
          output.T5 = methods.freestyle.T5(data, (T1type !== 'undefined' || T4type !== 'undefined'))

          /** Calc A */
          var Aoutput = methods.freestyle.A(output.T1, output.T4, output.T5, levelData, simplified)
          output.PreA = Aoutput.PreA
          output.A = Aoutput.A

          console.log('uid:', uid, 'event:', event, 'T1:', output.T1,
            'T2:', output.T2, 'T3:', output.T3, 'T4:', output.T4,
            'T5:', output.T5, 'final:', output.PreA, 'multiplied:',
            output.A)

          return output
        }
      },
      /**
       * calculate a users final score
       * @param  {Object} data
       * @param  {Object} subevents what event's are enabled
       * @param  {Boolean} rankAll  if scores should be calculated for everyone
       * @param  {String} uid
       * @return {Number}
       */
      finalscore: function (data, subevents, rankAll, uid) {
        if (typeof data !== 'undefined') {
          /* only existing and enabled events with scores */
          var keys = Object.keys(data).filter(function (abbr) {
            return Abbr.events().indexOf(abbr) >= 0 && typeof data[abbr] !== 'undefined' && Object.keys(data[abbr]).length !== 0
          })
          if (typeof subevents === 'undefined') return undefined
          var events = Object.keys(subevents)
          var enabled = events.filter(function (abbr) {
            return subevents[abbr]
          })
          var i
          var total

          /* cal the final score if the participant participated in all events, or if rankAll is true */
          if (rankAll || keys.length === enabled.length) {
            total = 0
            for (i = 0; i < keys.length; i++) {
              if (Abbr.isSpeed(keys[i]) && typeof data[keys[i]] !== 'undefined') {
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
        /**
         * Rank speed events
         * @param  {Object} data
         * @param  {String} event
         * @param  {Object} config       category's config
         * @param  {Boolean} rankAll     if everyone should be ranked, even those without scores
         * @param  {Object} participants Object of participants
         * @return {Object}              object of ranks
         */
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
                score: -Infinity
              })
            }
          }

          /* sort descending */
          scores.sort(function (a, b) {
            return b.score - a.score // sort descending
          })

          /* should the rank be multiplied by some factor? */
          if ((config.simplified || config.enableFactors) &&
          typeof config.factors !== 'undefined' && typeof config.factors[event] !== 'undefined') {
            fac = config.factors[event] || 1
          }

          /* find rank and add to object */
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
        /**
         * Rank freestyle events
         * @param  {Object} data
         * @param  {String} event
         * @param  {Object} config       category's config
         * @param  {Boolean} rankAll     if everyone should be ranked, even those without scores
         * @param  {Object} participants object with participants
         * @return {Object}              object with ranks
         */
        freestyle: function (data, event, config, rankAll, participants) {
          var keys
          var Cscores = []
          var Dscores = []
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
            if (typeof data[keys[i]] !== 'undefined' && typeof data[keys[i]][event] !== 'undefined' && Object.keys(data[keys[i]][event]).length !== 0 && data[keys[i]][event].dns !== true) {
              Cscores.push((data[keys[i]][event].T4 - (data[keys[i]][event].T5 / 2)))
              Dscores.push((data[keys[i]][event].T1 - (data[keys[i]][event].T5 / 2)))
            } else if (rankAll) {
              /* for those who don't have a score push negative infinity */
              if ((typeof data[keys[i]] === 'undefined' || typeof data[keys[i]][event] === 'undefined' || Object.keys(data[keys[i]][event]).length === 0 || data[keys[i]][event].dns !== true)) {
                Cscores.push(-Infinity)
                Dscores.push(-Infinity)
              }
            }
          }
          /* sort descending */
          Cscores.sort(function (a, b) {
            return b - a // sort descending
          })
          Dscores.sort(function (a, b) {
            return b - a // sort descending
          })

          /* calc everyones Crank and Drank and push tham and their sum into an array */
          for (i = 0; i < keys.length; i++) {
            var CtempScore = (typeof data[keys[i]] !== 'undefined' && typeof data[keys[i]][event] !== 'undefined' && Object.keys(data[keys[i]][event]).length !== 0 && data[keys[i]][event].dns !== true ? data[keys[i]][event].T4 - (data[keys[i]][event].T5 / 2) : (rankAll ? -Infinity : undefined))
            var DtempScore = (typeof data[keys[i]] !== 'undefined' && typeof data[keys[i]][event] !== 'undefined' && Object.keys(data[keys[i]][event]).length !== 0 && data[keys[i]][event].dns !== true ? data[keys[i]][event].T1 - (data[keys[i]][event].T5 / 2) : (rankAll ? -Infinity : undefined))
            var TtempScore = (typeof data[keys[i]] !== 'undefined' && typeof data[keys[i]][event] !== 'undefined' && Object.keys(data[keys[i]][event]).length !== 0 && data[keys[i]][event].dns !== true ? data[keys[i]][event].A : (rankAll ? -Infinity : undefined))
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
                cRank: Number(CtempRank),
                dRank: Number(DtempRank),
                score: TtempScore,
                uid: keys[i]
              })
            }
          }

          /* sort ascending on rank but descending on score if ranksums are equal */
          ranksums.sort(function (a, b) {
            if (a.ranksum === b.ranksum) {
              return b.score - a.score
            } else {
              return a.ranksum - b.ranksum
            }
          })

          /* find out if the ranks should be multiplied by a factor */
          if ((config.simplified || config.enableFactors) && config.factors &&
            config.factors[event]) {
            fac = config.factors[event] || 1
          } else if (event === 'srsf') {
            fac = 2
          }

          for (i = 0; i < ranksums.length; i++) {
            /* rank ranksums */
            var tRank = (ranksums.findIndex(function (obj) {
              if (rankAll && ranksums[i].score === -Infinity) {
                return obj.ranksum === ranksums[i].ranksum
              }
              return obj.uid === ranksums[i].uid
            }) + 1)
            ranks[ranksums[i].uid].total = {
              rank: tRank,
              mult: tRank * fac,

              cRank: ranksums[i].cRank,
              dRank: ranksums[i].dRank
            }
          }

          return ranks
        },
        /**
         * rank overall based on ranksum
         * @param  {Object} data
         * @param  {Object} scores
         * @return {Object}
         */
        overall: function (data, scores) {
          var output = {}
          var eventOrder = Abbr.weightedOrder()
          var ranksums = Object.keys(data)
            .map(function (uid) {
              return {
                uid: uid,
                ranksum: data[uid]
              }
            })

          ranksums.sort(function (a, b) {
            if (a.ranksum === b.ranksum) {
              /* resolve ties */
              for (var i = 0; i < eventOrder.length; i++) {
                if (eventOrder[i] === 'final' && scores[a.uid][eventOrder[i]] !== scores[b.uid][eventOrder[i]]) return scores[b.uid][eventOrder[i]] - scores[a.uid][eventOrder[i]]
                if (Abbr.isSpeed(eventOrder[i]) && scores[a.uid][eventOrder[i]].Y !== scores[b.uid][eventOrder[i]].Y) return scores[b.uid][eventOrder[i]].Y - scores[a.uid][eventOrder[i]].Y
                if (!Abbr.isSpeed(eventOrder[i]) && scores[a.uid][eventOrder[i]].A !== scores[b.uid][eventOrder[i]].A) return scores[b.uid][eventOrder[i]].A - scores[a.uid][eventOrder[i]].A
              }
            }
            return a.ranksum - b.ranksum
          })
          for (var i = 0; i < ranksums.length; i++) {
            output[ranksums[i].uid] = ranksums.findIndex(function (obj) {
              return obj.uid === ranksums[i].uid
            }) + 1
          }

          return output
        },
        /**
         * calculate ranksums
         * @param  {Object[]} arr         Object of participats
         * @param  {Object}   finalscores
         * @param  {Object}   subevents   enabled events in category
         * @param  {Boolean}  simplified  if the category uses simplified rules
         * @return {Object}
         */
        sum: function (arr, finalscores, subevents, simplified) {
          var output = {}
          for (var i = 0; i < arr.length; i++) {
            if (typeof finalscores[arr[i].uid] === 'undefined' || typeof finalscores[arr[i].uid].final === 'undefined') {
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
                return (simplified && Config.functions.simplRankSum ? Config.functions.simplRankSum(sum, arr[i][abbr], abbr) || Number(sum) + Number(arr[i][abbr].mult) : Number(sum) + Number(arr[i][abbr].mult))
              }, 0)
            output[arr[i].uid] = sum
          }
          return output
        }
      },
      /**
       * check if the participant has been in all events
       * @param  {String[]} enabled enabled events
       * @param  {String[]} partook events the participant has partaken in
       * @return {Boolean}
       */
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
      }
    }
    return methods
  })
