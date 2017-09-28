/* global Config */
Config.MissJudges = true // default: false
Config.ShowRaw = false // default: false
Config.ShowDC = true // default: false, (Show Diff and Creat Scores + rank in overall table)
Config.ShowAllTables = true // default: false
Config.Simplified = true // default: false
Config.CheckStart = 0 // default: 0

// fill in nonabbrs if you want to use non standard abbrs, add non-standard events here as well
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
  srtu: {
    abbr: '',
    name: ''
  },
  srsf: {
    abbr: '',
    name: 'Masters Freestyle'
  },
    // ------------------
  srsr: {
    abbr: '',
    name: ''
  },
  srpf: {
    abbr: 'srf2',
    name: ''
  },
  srtf: {
    abbr: 'srf4',
    name: ''
  },
  ddsr: {
    abbr: '',
    name: ''
  },
  ddsf: {
    abbr: 'ddf3',
    name: ''
  },
  ddpf: {
    abbr: 'ddf4',
    name: ''
  }
}

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
  if (event === 'srsf') {
    output.l = function (x) {
      return (3 / (Math.pow(1.5, (5 - x))))
    }
    output.lmax = 6
    output.rq = 50 / 14
    output.fac = 2
  } else if (event === 'srpf' || event === 'srtf') {
    output.l = function (x) {
      return (3.5 / (Math.pow(1.5, (4 - x))))
    }
    output.lmax = 6
    output.rq = 50 / 16
  } else if (event === 'ddsf' || event === 'ddpf') {
    output.l = function (x) {
      return (3 / (Math.pow(1.5, (4 - x))))
    }
    output.lmax = 5
    output.rq = 50 / 16
  }
  return output
}
