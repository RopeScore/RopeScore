/* global angular */
var Config = {
  Debug: true, // default: false
  BuildDate: 1509280757845,
  version: '2.2.0-intl',
  Eval: false, // default: false

  MissJudges: false, // default: false
  ShowRaw: false, // default: false
  ShowDC: true, // default: true, (Show Diff and Creat Scores + rank in overall table)
  ShowAllTables: true, // default: true
  Simplified: false, // default: false
  CheckStart: 0, // default: 0

  functions: {},

  // fill in nonabbrs if you want to use non standard abbrs, add non-standard events here as well
  /* Nonabbrs: {
    srss: {
      abbr: '',
      name: '',
      weight: 0
    },
    srse: {
      abbr: '',
      name: '',
      weight: 2
    },
    srtu: {
      abbr: '',
      name: '',
      weight: 0
    },
    srsf: {
      abbr: '',
      name: '',
      weight: 4
    },
    // ------------------
    srsr: {
      abbr: '',
      name: '',
      weight: 1
    },
    srpf: {
      abbr: '',
      name: '',
      weight: 5
    },
    srtf: {
      abbr: '',
      name: '',
      weight: 6
    },
    ddsr: {
      abbr: '',
      name: '',
      weight: 3
    },
    ddsf: {
      abbr: '',
      name: '',
      weight: 7
    },
    ddpf: {
      abbr: '',
      name: '',
      weight: 8
    }
  }, */

  Order: {
    a: {
      mob: {
        desc: 'Music on the beat',
        weight: {
          sr: 0.75,
          dd: 0.75
        }
      },
      uom: {
        desc: 'Using the Music',
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
      int: {
        desc: 'Interaction',
        dd: true,
        weight: {
          sr: 0,
          dd: 0.5
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
}
Config.SimplOrder = Config.Order
Config.Country = Config.version.split('-').slice(-1)[0]
Config.Country = (isNaN(Number(Config.Country)) ? Config.Country : undefined)
Config.releaseRemoteUrl = function (arch, platform, country) {
  return `https://download.ropescore.com/${country || Config.Country}/${platform || process.platform}/${arch || process.arch}`
}
Config.functions.simplifiedLevelData = function () {}
Config.licence = {
  licensee: '',
  dateTo: 0,
  dateFrom: Config.BuildDate
}

function addScript (src) {
  var s = document.createElement('script')
  s.setAttribute('src', src)
  document.body.appendChild(s)
}

if (typeof module === 'object' && typeof exports !== 'undefined') {
  // Node. Does not work with strict CommonJS, but
  // only CommonJS-like environments that support module.exports,
  // like Node.
  module.exports = Config
} else {
  if (typeof Config.Country !== 'undefined' && Config.Country !== 'intl') addScript('/configs/' + Config.Country + '.js')
  if (typeof angular === 'object') {
    angular.module('Config', [])
    .factory('Config', function () {
      return Config
    })
  }
}
