/* global angular */
if (typeof module === 'object' && typeof exports !== 'undefined') {
  var Config = {licence: {}, functions: {}}
}

Config.Simplified = true // default: false

Config.licence.licensee = 'Kämpinge Gymnastikförening'
Config.licence.dateFrom = new Date('2018-01-01 00:00:00Z+0100').getTime()
Config.licence.dateTo = Number(Config.licence.dateFrom) + (365 * 24 * 60 * 60 * 1000)

/**
 * LevelData equivalent for simplified rules
 * @param  {String} event the event the data is requested for
 * @return {Object}       an object with multiplication factors, maxes and alike
 */
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

/**
 * different function to use in array.reduce to calculate a participants ranksum
 * to be used for simplified rules
 * @param  {Number} sum current sum
 * @param  {Object} obj Object to add values to the sum from
 * @return {Number}     returns the new sum
 */
Config.functions.simplRankSum = function (sum, obj) {
  console.log(sum, obj)
  if (typeof obj.cRank !== 'undefined' || typeof obj.dRank !== 'undefined') {
    return Number(sum) + Number(obj.cRank) + Number(obj.dRank)
  } else {
    return Number(sum) + Number(obj.mult)
  }
}

/**
 * Order to display score enterers in, also maxes and weights for simplified rules
 * @type {Object}
 */
Config.SimplOrder = Config.Order

if (typeof module === 'object' && typeof exports !== 'undefined') {
  module.exports = Config.licence.dateTo
} else if (typeof angular === 'object') {
  angular.element(document.querySelector('html')).scope().reload()
}
