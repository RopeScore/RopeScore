/* global angular */
if (typeof module === 'object' && typeof exports !== 'undefined') {
  var Config = {licence: {}, functions: {}}
}

Config.MissJudges = false // default: false
Config.ShowRaw = false // default: false
Config.ShowDC = true // default: false, (Show Diff and Creat Scores + rank in overall table)
Config.ShowAllTables = true // default: false
Config.Simplified = true // default: false
Config.CheckStart = 0 // default: 0

// Config.licence.licensee = 'Svenska Gymnastikförbundet'
Config.licence.dateFrom = new Date('2017-09-30 00:00:00Z+0100').getTime()
Config.licence.dateTo = Number(Config.licence.dateFrom) + (365 * 24 * 60 * 60 * 1000)

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
  output.l = function (x) {
    return (0.5 * x) + 0.5
  }
  output.rq = 0
  if (event === 'srsf') {
    output.fac = 2
  }
  return output
}

Config.functions.simplRankSum = function (sum, obj) {
  console.log(sum, obj)
  return Number(sum) + Number(obj.cRank) + Number(obj.dRank)
}

Config.SimplOrder = {
  a: {
    mob: {
      desc: 'Music on the beat',
      weight: {
        sr: 0.75,
        dd: 0.75
      }
    },
    int: {
      desc: 'Interaction',
      dd: true,
      weight: {
        sr: 0,
        dd: 0.5
      }
    },
    uom: {
      desc: 'Using the Music',
      sr: true,
      weight: {
        sr: 0.75,
        dd: 0.75
      }
    },
    mov: {
      desc: 'Movement',
      weight: {
        sr: 0.5,
        dd: 0.5
      }
    },
    fbe: {
      desc: 'Form of Body & Execution',
      weight: {
        sr: 1,
        dd: 0.75
      }
    },
    ori: {
      desc: 'Originality',
      weight: {
        sr: 1,
        dd: 0.75
      }
    },
    mis: {
      desc: 'Misses',
      weight: {
        sr: 1,
        dd: 1
      }
    }
  },
  b: {
    dd: {
      tis: {
        desc: 'Amount of different <b>Turner Involvement Skills</b>',
        max: 8
      },
      swi: {
        desc: 'Amount of different <b>Turner / Jumper Switches</b>',
        max: 5
      },
      aer: {
        desc: 'Amount of <b>Gymnastics that are aerials</b>',
        max: 3
      },
      nae: {
        desc: 'Amount of <b>Gymnastics that are <em>NOT</em> aerials</b>',
        max: 2
      },
      spd: {
        desc: '<b>Speed Dance</b>',
        max: 1
      },
      rel: {
        desc: '<b>Release</b>',
        max: 1
      },
      jis: {
        desc: 'Amount of <b>Jumper Interactions</b>',
        max: 2,
        events: ['ddpf']
      }
    },
    sr: {
      mul: {
        desc: 'Amount of separate <b>sets of at least 4 different triple Multiples</b>',
        max: 3
      },
      gym: {
        desc: 'Amount of different <b>Gymnastics</b>',
        max: 3
      },
      pow: {
        desc: 'Amount of different <b>Power Skills</b>',
        max: 3
      },
      spd: {
        desc: 'Amount of different <b>Speed Dances</b>',
        max: 3
      },
      rel: {
        desc: 'Amount of different <b>Releases</b>',
        max: 3
      },
      wra: {
        desc: 'Amount of different <b>Wraps</b>',
        max: 3
      },
      pai: {
        desc: 'Amount separate <b>Pair Interactions</b>',
        max: 3,
        events: ['srtf', 'srpf']
      }
    }
  },
  d: true,
  h: true
}

if (typeof module === 'object' && typeof exports !== 'undefined') {
  module.exports = Config.licence.dateTo
} else if (typeof angular === 'object') {
  angular.element(document.querySelector('html')).scope().reload()
}
