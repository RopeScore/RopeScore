/* global angular */
if (typeof module === 'object' && typeof exports !== 'undefined') {
  var Config = {licence: {}, functions: {}}
}

Config.MissJudges = true // default: false
Config.ShowRaw = false // default: false
Config.ShowAllTables = true // default: true
Config.Simplified = true // default: false
Config.CheckStart = 0 // default: 0

/**
 * fill in nonabbrs if you want to use non standard abbrs, add non-standard events here as well
 * @type {Object}
 */
Config.Nonabbrs = {
  srss: {
    abbr: 'srm30s',
    name: '30s Speed'
  },
  srse: {
    abbr: 'srm3min',
    name: '3 min Speed'
  },
  // ---- BEGIN EXTRA ----
  srsj: {
    abbr: 'srs1min',
    name: '1 min Speed',
    speed: true,
    masters: true
  },
  srd: {
    abbr: 'srdr',
    name: 'Double Unders Relay',
    masters: true,
    speed: true
  },
  // ---- END EXTRA ----
  srtu: {},
  srsf: {
    name: 'Masters Freestyle'
  },
  // ------------------
  srsr: {},
  srpf: {
    abbr: 'srf2'
  },
  srtf: {
    abbr: 'srf4'
  },
  ddsr: {},
  ddsf: {
    abbr: 'ddf3'
  },
  ddpf: {
    abbr: 'ddf4'
  }
}

/**
 * Order to display score enterers in, also maxes and weights
 * @type {Object}
 */
Config.Order = {
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
      nae: {
        desc: 'Amount of <b>Gymnastics that are <em>NOT</em> aerials</b>',
        max: 2
      },
      aer: {
        desc: 'Amount of <b>Gymnastics that are aerials</b>',
        max: 3
      },
      spd: {
        desc: '<b>Speed Dance</b>',
        max: 2
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
  a: {
    mob: {
      desc: 'Music on the beat',
      weight: {
        sr: 0.5,
        dd: 0.5
      }
    },
    uom: {
      desc: 'Using the Music',
      weight: {
        sr: 0.5,
        dd: 0.5
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
        dd: 1
      }
    },
    ori: {
      desc: 'Originality',
      weight: {
        sr: 1,
        dd: 1
      }
    },
    imp: {
      desc: 'Overall Impression and Entertainment value',
      weight: {
        sr: 0.5,
        dd: 0.5
      }
    }
  },
  d: true,
  m: true,
  h: true
}
Config.SimplOrder = Config.Order

Config.licence.licensee = 'Skipping Australia'

/**
 * @param  {String} event the event the data is requested for
 * @return {Object}       an object with multiplication factors, maxes and alike
 */
Config.functions.simplifiedLevelData = function (event) {
  var output = {}
  output.lmaxes = {
    '0': 10,
    '1': 20,
    '2': 30,
    '3': -1,
    '4': -1,
    '5': -1
  }
  output.lmin = 1
  output.event = event
  if (event === 'srsf') {
    output.l = function (x) {
      return (3 / (Math.pow(1.5, (5 - x))))
    }
    output.lmax = 6
    output.rqMax = 14
    output.fac = 2
  } else if (event === 'srpf' || event === 'srtf') {
    output.l = function (x) {
      return (3.5 / (Math.pow(1.5, (4 - x))))
    }
    output.lmax = 6
    output.rqMax = 16
  } else if (event === 'ddsf' || event === 'ddpf') {
    output.l = function (x) {
      return (3 / (Math.pow(1.5, (4 - x))))
    }
    output.lmax = 5
    output.rqMax = 16
  }
  output.rq = 50 / output.rqMax
  return output
}

if (typeof module === 'object' && typeof exports !== 'undefined') {
  module.exports = Config.licence.dateTo
} else if (typeof angular === 'object') {
  angular.element(document.querySelector('html')).scope().reload()
}
