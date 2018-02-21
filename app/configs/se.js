/* global angular */
if (typeof module === 'object' && typeof exports !== 'undefined') {
  var Config = {licence: {}, functions: {}}
}

Config.Simplified = true // default: false

Config.licence.licensee = 'Kämpinge Gymnastikförening'
Config.licence.dateFrom = new Date('2018-01-01 00:00:00Z+0100').getTime()
Config.licence.dateTo = Number(Config.licence.dateFrom) + (365 * 24 * 60 * 60 * 1000)

/**
 * LevelData equivalent for simplified rules
 * @param  {String} event the event the data is requested for
 * @return {Object}       an object with multiplication factors, maxes and alike
 */
Config.functions.simplifiedLevelData = function (event) {
  var output = {}
  output.lmaxes = {
    '0': -1,
    '1': -1,
    '2': -1,
    '3': -1,
    '4': -1,
    '5': -1
  }
  output.lmin = 1
  output.lmax = 5
  output.noDrop = true
  output.noMaxes = true
  output.l = function (x) {
    return (0.5 * x) + 0.5
  }
  output.freestyleFac = {
    T1: 1,
    T2: 1
  }
  output.rq = 0
  if (event === 'srsf') {
    output.fac = 2
  }
  return output
}

Config.SimplNoMisses = true
Config.SimplRawSpeed = true

/**
 * different function to use in array.reduce to calculate a participants ranksum
 * to be used for simplified rules
 * @param  {Number} sum current sum
 * @param  {Object} obj Object to add values to the sum from
 * @return {Number}     returns the new sum
 */
Config.functions.simplRankSum = function (sum, obj) {
  console.log(sum, obj)
  if (typeof obj.cRank !== 'undefined' || typeof obj.dRank !== 'undefined') {
    return Number(sum) + Number(obj.cRank) + Number(obj.dRank)
  } else {
    return Number(sum) + Number(obj.mult)
  }
}

/**
 * Order to display score enterers in, also maxes and weights for simplified rules
 * @type {Object}
 */
Config.SimplOrder = {
  a: {
    mob: {
      desc: 'Hoppar i takt till musiken',
      weight: {
        sr: 1,
        dd: 1
      }
    },
    uom: {
      desc: 'Använder Musiken',
      sr: true,
      weight: {
        sr: 1,
        dd: 1
      }
    },
    int: {
      desc: 'Interaktioner',
      dd: true,
      weigtht: {
        sr: 1,
        dd: 1
      }
    },
    mov: {
      desc: 'Rörelse',
      weight: {
        sr: 1,
        dd: 1
      }
    },
    fbe: {
      desc: 'Utförande, Teknik',
      weight: {
        sr: 1,
        dd: 1
      }
    },
    imp: {
      desc: 'Helhetsintryck',
      weight: {
        sr: 1,
        dd: 1
      }
    },
    mis: {
      desc: 'Missar',
      weight: {
        sr: 1,
        dd: 1
      }
    }
  },
  d: true,
  h: true
}

Config.SimplResultsCols = {
  overall: {
    speed: {
      score: true,
      rank: true
    },
    freestyle: {
      rq: false,
      pres: false,
      diff: false,
      deduc: false,

      cScore: true,
      cRank: true,
      dScore: true,
      dRank: true,

      score: false,
      rsum: false,
      rank: false
    }
  },
  events: {
    speed: {
      score: true,
      rank: true
    },
    freestyle: {
      rq: false,
      pres: false,
      diff: false,
      deduc: false,

      cScore: true,
      cRank: true,
      dScore: true,
      dRank: true,

      score: false,
      rsum: false,
      rank: false
    }
  }
}

if (typeof module === 'object' && typeof exports !== 'undefined') {
  module.exports = Config.licence.dateTo
} else if (typeof angular === 'object') {
  angular.element(document.querySelector('html')).scope().reload()
}
