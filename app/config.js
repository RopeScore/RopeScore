const Config = {
  Debug: false, // default: false
  LicenceDate: 1500031370004,
  version: '2.0.0-au94',
  Eval: true, // default: false

  releaseRemoteUrl: function(arch, platform) {
    return `https://download.swant.pw/ropescore/${platform || process.platform}/${arch || process.arch}`
  },
  MissJudges: true, // default: false
  ShowRaw: false, // default: false
  ShowDC: true, // default: false, (Show Diff and Creat Scores + rank in overall table)
  ShowAllTables: false, // default: false
  Simplified: true, // default: false
  CheckStart: 0, // default: 0

  // fill in nonabbrs if you want to use non standard abbrs, add non-standard events here as well
  Nonabbrs: {
    srss: {
      abbr: "srm30s",
      name: "30s Speed"
    },
    srse: {
      abbr: "srm3min",
      name: "3 min Speed"
    },
    // ---- BEGIN EXTRA ----
    srsj: {
      abbr: "srs1min",
      name: "1 min Speed",
      speed: true,
      masters: true
    },
    srd: {
      abbr: "srdr",
      name: "Double Unders Relay",
      masters: true,
      speed: true
    },
    // ---- END EXTRA ----
    srtu: {
      abbr: "",
      name: ""
    },
    srsf: {
      abbr: "",
      name: "Masters Freestyle"
    },
    // ------------------
    srsr: {
      abbr: "",
      name: ""
    },
    srpf: {
      abbr: "srf2",
      name: ""
    },
    srtf: {
      abbr: "srf4",
      name: ""
    },
    ddsr: {
      abbr: "",
      name: ""
    },
    ddsf: {
      abbr: "ddf3",
      name: ""
    },
    ddpf: {
      abbr: "ddf4",
      name: ""
    }
  }
}

if (typeof module === 'object' && typeof exports !== 'undefined') {
  // Node. Does not work with strict CommonJS, but
  // only CommonJS-like environments that support module.exports,
  // like Node.
  module.exports = Config;
} else if (typeof angular == 'object') {
  angular.module('Config', [])
    .factory('Config', function() {
      return Config;
    })
}
