/* global angular */
var Config = {
  Debug: true, // default: false
  LicenceDate: 1506868101913,
  version: '2.0.4-se',
  Eval: false, // default: false

  MissJudges: false, // default: false
  ShowRaw: false, // default: false
  ShowDC: true, // default: true, (Show Diff and Creat Scores + rank in overall table)
  ShowAllTables: true, // default: true
  Simplified: false, // default: false
  CheckStart: 0, // default: 0

  functions: {},

  // fill in nonabbrs if you want to use non standard abbrs, add non-standard events here as well
  Nonabbrs: {
    srss: {
      abbr: '',
      name: ''
    },
    srse: {
      abbr: '',
      name: ''
    },
    srtu: {
      abbr: '',
      name: ''
    },
    srsf: {
      abbr: '',
      name: ''
    },
    // ------------------
    srsr: {
      abbr: '',
      name: ''
    },
    srpf: {
      abbr: '',
      name: ''
    },
    srtf: {
      abbr: '',
      name: ''
    },
    ddsr: {
      abbr: '',
      name: ''
    },
    ddsf: {
      abbr: '',
      name: ''
    },
    ddpf: {
      abbr: '',
      name: ''
    }
  }
}
Config.country = Config.version.split('-').slice(-1)[0].substring(0, 2)
Config.country = (isNaN(Number(Config.country)) ? Config.country : undefined)
Config.releaseRemoteUrl = function (arch, platform, country) {
  return `https://download.swant.pw/ropescore/${country || Config.country}/${platform || process.platform}/${arch || process.arch}`
}
Config.functions.simplifiedLevelData = function () {}
Config.licence = {
  licensee: '',
  dateTo: 0,
  dateFrom: Config.LicenceDate
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
  if (typeof Config.country !== 'undefined') addScript('/configs/' + Config.country + '.js')
  if (typeof angular === 'object') {
    angular.module('Config', [])
    .factory('Config', function () {
      return Config
    })
  }
}
