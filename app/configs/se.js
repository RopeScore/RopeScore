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

if (typeof module === 'object' && typeof exports !== 'undefined') {
  module.exports = Config.licence.dateTo
} else if (typeof angular === 'object') {
  angular.element(document.querySelector('html')).scope().reload()
}
