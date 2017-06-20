const Config = {
  Debug: false, // default: false
  LicenceDate: 1497965449147,
  version: '2.0.0-au8',
  Eval: true, // default: false

  releaseRemoteUrl: function(arch, platform) {
    return `https://download.swant.pw/ropescore/${platform || process.platform}/${arch || process.arch}`
  },
  MissJudges: true, // default: false
  ShowRaw: true, // default: false
  ShowDC: true, // default: false
  ShowAllTables: false, // default: false
  CheckStart: 0 // default: 0
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
