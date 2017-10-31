/* global angular */
var Config = {
  /** @type {Boolean} Set debug mde on or off, will enable devTools and open on start if true */
  Debug: false, // default: false
  /** @type {Number} Datetime when the build was made */
  BuildDate: 1509485921976,
  /** @type {String} current version and country */
  version: '2.2.1-intl',
  /** @type {Boolean} If this is an evaluation version */
  Eval: false, // default: false

  /** @type {Boolean} If misses are counted by separate judges */
  MissJudges: false, // default: false
  /** @type {Boolean} If raw scores should be shown in the final overall table */
  ShowRaw: false, // default: false
  /** @type {Boolean} Show Diff, pres, rq, and miss scores and ranks in master table */
  ShowDC: true, // default: true, (Show Diff and Creat Scores + rank in overall table)
  /** @type {Boolean} Display all result tables in the program and not just exported */
  ShowAllTables: true, // default: true
  /** @type {Boolean} Specifies if there are simplified rules avilable */
  Simplified: false, // default: false
  /** @type {Number} Position to start checksums on */
  CheckStart: 0, // default: 0

  /** @type {Object} custom functions */
  functions: {},

  /**
   * fill in nonabbrs if you want to use non standard abbrs, add non-standard events here as well
   * @type {Object}
   */
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

  /**
   * Order and weigths for judges and what they judge
   * @type {Object}
   */
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
/** @type {Object} The order for simplified rules */
Config.SimplOrder = Config.Order
/** @type {?String} Gets the country from the version */
Config.Country = Config.version.split('-').slice(-1)[0]
Config.Country = (isNaN(Number(Config.Country)) ? Config.Country : undefined)
/**
 * Get the Squirrel Update URL
 * @param  {String} arch     architecture (ia32, x64, armv7l...)
 * @param  {String} platform platform (linux, win32, darwin)
 * @param  {String} country  the country version
 * @return {String}          URL
 */
Config.releaseRemoteUrl = function (arch, platform, country) {
  return `https://download.ropescore.com/${country || Config.Country}/${platform || process.platform}/${arch || process.arch}`
}
Config.functions.simplifiedLevelData = function () {}
/** @type {Object} Info on who can use this version */
Config.licence = {
  licensee: '',
  dateTo: 0,
  dateFrom: Config.BuildDate
}

/**
 * Function to add a script to the current page, used to add country version's conf
 * @param {String} src URL/path
 */
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
