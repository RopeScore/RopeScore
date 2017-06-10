const Config = {
  Debug: false,
  LicenceDate: new Date("2017-06-09")
    .getTime(),
  MissJudges: true,
  version: '2.0.0-au3',
  Eval: true,
  releaseRemoteUrl: function(arch, platform) {
    return `https://download.swant.pw/ropescore/${platform || process.platform}/${arch || process.arch}`
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
