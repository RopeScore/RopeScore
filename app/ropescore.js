/* global angular, WebSocket, lsbridge, store, XLSX, sha1, performance */
'use strict'

/**
 * rounds a number n to digit decimal places
 * @param  {Number} n
 * @param  {?Number} digits deciimal places
 * @return {Number}        Rounded number
 */
Math.roundTo = function (n, digits) {
  digits = digits || 0

  var multiplicator = Math.pow(10, digits)
  n = parseFloat((n * multiplicator))
  var test = (Math.round(n) / multiplicator)
  // console.log(`rounded ${init} to ${test}`)
  if (isNaN(test)) {
    return undefined
  }
  return test
}

/**
 * take a number or string and make it a specified length by prefixing a character
 * @param  {String|Number} n     The number or string to pad
 * @param  {Number}        width How long the string should be (at least)
 * @param  {String}        z     The prefix character, defaults to 0
 * @return {String}              The padded number as a string
 */
function pad (n, width, z) { // eslint-disable-line
  z = z || '0'
  n = n + ''
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n
}

/**
 * Takes a string and makes it "safe" to store as a filename
 * @param  {String} str
 * @return {String}
 */
function nameCleaner (str) {
  str.replace(/[#%&{}\\<>*?/$!'":@|\s]/gi, '_')
  return str
}

/* listen to the error websocket and log backend errors to devTools */
var errorSocket = new WebSocket('ws://localhost:3333/errors')
errorSocket.onmessage = function (evt) {
  var data = JSON.parse(evt.data)
  if (data.type === 'update') return
  console.log('backend error:', data)
}

/* listen for db updates */
lsbridge.subscribe('ropescore-updates', function (data) {
  if (data.type !== 'update') return
  console.log('Update')
})

/**
 * @namespace ropescore
 * @requires ngRoute
 */
angular.module('ropescore', [
  'ngRaven',
  'ngRoute',
  'ngSanitize',
  'ropescore.dash',
  'ropescore.config',
  'ropescore.config.participants',
  'ropescore.event',
  'ropescore.score',
  'ropescore.score.speed',
  'ropescore.results',
  'ropescore.display',
  'ropescore.about.licence',
  'ropescore.about.docs',
  'ropescore.about.changelog',
  'ropescore.bugreport',
  'ropescore.combine',
  'ropescore.globconfig',
  'Config',
  'Calc'
])

  .config([
    '$locationProvider', '$routeProvider', '$compileProvider',
    function ($locationProvider, $routeProvider, $compileProvider) {
      /**
       * @description ngRoute with html5 mode (no hashbang, but with fallback)
       * @memberOf ropescore.ropescore
       */
      $locationProvider.html5Mode(true).hashPrefix('!')

      $routeProvider.otherwise({
        redirectTo: '/'
      })

      $compileProvider.aHrefSanitizationWhitelist(
        /^\s*(https?:|ftp:|mailto:|data:application\/json)/)
    }
  ])

  .run(function ($location, $route, $rootScope, Config, Db, Notif) {
    /** return to dashboard */
    $rootScope.goHome = function () {
      $location.path('/')
    }

    /** reload route */
    $rootScope.reload = function () {
      $route.reload()
    }

    /** set category id */
    $rootScope.setID = function (id) {
      console.log(`id: ${id}`)
      $rootScope.id = id
    }

    $rootScope.isNew = function (bool) {
      if (bool) {
        console.log(`New category`)
        $rootScope.newCat = true
      } else {
        $rootScope.newCat = false
      }
    }

    /** generate copyright text */
    $rootScope.copyright = function () {
      return '2017-' + ((new Date()).getFullYear())
    }

    $rootScope.netList = function (obj) {
      return Object.keys(obj).filter(function (key) {
        return $rootScope.networkStatus[key]
      }).join(', ')
    }

    $rootScope.any = function (obj) {
      let keys = Object.keys(obj)
      if (keys.length === 0) return false
      return keys.reduce(function (a, curr) {
        return obj[curr] || a
      }, false)
    }

    $rootScope.updateGlobConfig = function () {
      $rootScope.computerName = Db.get('computer-name')
      $rootScope.disabledNotifs = Db.get('disabled-notifs')
      $rootScope.liveConfig = Db.get('rslive-config')
    }
    $rootScope.updateGlobConfig()

    $rootScope.version = Config.version
    $rootScope.Ruleset = Config.Ruleset

    $rootScope.$on('$routeChangeStart', function (next, current) {
      $rootScope.isNew(false)
      console.log(`Navigated to ${$location.path()}`)
    })
  })

  .factory('Db',
    function ($rootScope, $q) {
      var methods = {
        /**
         * @param  {String} storeName what store name to save to
         * @return {Object}           contents of database
         */
        get: function (storeName) {
          console.log('got data from database')
          return store.get(storeName || 'ropescore') || (storeName ? undefined : {})
        },
        /**
         * Overwrite database with new data
         * @param  {Object} newData
         * @param  {String} store   what store name to save to
         * @return {Promise}        sending data update message to backend via socket
         */
        set: function (newData, storeName) {
          console.log('saved data to databse')
          store.set(storeName || 'ropescore', newData)
          // methods.data = methods.get()
          lsbridge.send('ropescore-updates', { type: 'update' })
          // return dbSocket.send('{"type":"update"}')
        }
      }
      /**
       * @type {Object} contents of databse
       */
      // methods.data = methods.get()

      lsbridge.subscribe('ropescore-updates', function (data) {
        if (data.type !== 'update') return
        console.log('Update ng')

        // methods.data = methods.get()
      })

      return methods
    })

  .factory('Cleaner', function () {
    /**
     * deletes false, null, empty strings from an object recursively to get a
     * clean object suitable for checksumming
     * @param  {Object} obj
     * @return {Object}
     */
    var clean = function (obj) {
      var scope = obj || {}
      var keys = Object.keys(scope)

      for (var i = 0; i < keys.length; i++) {
        if (scope[keys[i]] !== null && typeof scope[keys[i]] === 'object') {
          scope[keys[i]] = clean(scope[keys[i]])
        }
        if (scope[keys[i]] === null || scope[keys[i]] === '' || typeof scope[keys[i]] === 'undefined' || (typeof scope[keys[i]] === 'object' && Object.keys(scope[keys[i]]).length === 0) || (typeof scope[keys[i]] === 'boolean' && scope[keys[i]] === false)) {
          delete scope[keys[i]]
        }
      }
      return scope
    }
    return clean
  })

  .factory('Notif',
    function ($rootScope, $timeout, Checksum) {
      $rootScope.notifs = []
      return function Notif (title, msg, type = 'info', time = 10000) {
        if (typeof title === 'undefined' && typeof msg === 'undefined') return
        if (typeof $rootScope.disabledNotifs !== 'undefined' && $rootScope.disabledNotifs[type] === true) return

        let id = Checksum(title + Math.roundTo(Math.random() * 100000, 0))

        $rootScope.notifs.push({
          title: title || '',
          msg: msg || '',
          type: type,
          id: id,
          hide: true,
          timeout: (time === -1 ? undefined : $timeout(function () {
            let index = $rootScope.notifs.findIndex(function (obj) { return obj.id === id })
            if (index >= 0) $rootScope.notifs[index].close()
          }, time)),
          close: function () {
            let self = this
            self.hide = true
            if (typeof this.timeout !== 'undefined') $timeout.cancel(this.timeout)
            $timeout(function () {
              let index = $rootScope.notifs.findIndex(function (obj) { return obj.id === self.id })
              if (index >= 0) $rootScope.notifs.splice(index, 1)
            }, 300)
          }
        })

        $timeout(function () {
          let index = $rootScope.notifs.findIndex(function (obj) { return obj.id === id })
          if (index >= 0) $rootScope.notifs[index].hide = false
        })
      }
    })

  .factory('tablesToExcel', function ($rootScope, Abbr, Db) {
    /**
     * [description]
     * @param  {Object[]} tables array of tables
     * @param  {String} name     category name
     * @return {undefined}
     */
    return function (tables, name) {
      /**
       * Workbook
       * @type {Object}
       */
      var wb = XLSX.utils.book_new()
      var wopts = {
        bookType: 'xlsx',
        bookSST: true,
        type: 'base64'
      }
      if (!wb.Props) wb.Props = {}
      wb.Props.Title = (name ? 'Results for ' + (name) + ' - ' : '') + 'RopeScore'
      wb.Props.CreatedDate = new Date().toISOString()
      var uri = 'data:application/octet-streaml;base64,'
      for (var i = 0; i < tables.length; i++) {
        var sheetName = (tables[i].getAttribute('name').startsWith('overall') ? tables[i].getAttribute('name') : Abbr.abbr(tables[i].getAttribute('name').substring(0, 4)) + tables[i].getAttribute('name').substring(4) || ('Sheet' + (i + 1)))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(tables[i], {
          cellStyles: true
        }), sheetName)
      }
      console.log(wb)
      var wbout = XLSX.write(wb, wopts)

      var link = document.createElement('a')
      link.download = 'ropescore' + (name ? '-' + nameCleaner(name) : '') + ($rootScope.computerName ? '-' + nameCleaner($rootScope.computerName) : '') + '.xlsx'
      link.href = uri + wbout

      document.body.appendChild(link)
      link.click()

      // Cleanup the DOM
      document.body.removeChild(link)
      link = undefined
    }
  })

  .factory('Checksum', function (Config) {
    /**
     * Calculate the checksum of an object
     * @param  {Object} obj
     * @param  {Number} [n=5] amount of hexdigits starting on Config.CheckStart to keep
     * @return {String}
     */
    return function (obj, n = 5) {
      var string = (typeof obj !== 'undefined' ? JSON.stringify(obj) : '')
      var hash = sha1(string)
      var o = Config.CheckStart
      var checksum = hash.substring(o, o + n)
      return checksum
    }
  })

  .factory('Abbr', function (Config) {
    /**
     * Standard abbr definition
     * @type {Object}
     */
    var abbrs = {
      srss: {
        name: 'Single Rope Speed Sprint',
        weight: 0,
        masters: true,
        speed: true,
        speedFactor: 5
      },
      srse: {
        name: 'Single Rope Speed Endurance',
        weight: 2,
        masters: true,
        speed: true
      },
      srtu: {
        name: 'Single Rope Triple Unders',
        weight: 0,
        masters: true,
        speed: true
      },
      srsf: {
        name: 'Single Rope Single Freestyle',
        weight: 4,
        masters: true,
        speed: false
      },
      // ------------------
      srsr: {
        name: 'Single Rope Speed Relay',
        weight: 1,
        masters: false,
        speed: true,
        speedFactor: 3
      },
      srpf: {
        name: 'Single Rope Pair Freestyle',
        weight: 5,
        masters: false,
        speed: false
      },
      srtf: {
        name: 'Single Rope Team Freestyle',
        weight: 6,
        masters: false,
        speed: false
      },
      ddsr: {
        name: 'Double Dutch Speed Relay',
        weight: 3,
        masters: false,
        speed: true,
        speedFactor: 2
      },
      ddsf: {
        name: 'Double Dutch Single Freestyle',
        weight: 7,
        masters: false,
        speed: false
      },
      ddpf: {
        name: 'Double Dutch Pair Freestyle',
        weight: 8,
        masters: false,
        speed: false
      }
    }

    var functions = {
      /**
       * get nonabbrs from (countr)y config
       * @return {Object}
       */
      nonabbrs: function () {
        return Config.Nonabbrs || abbrs
      },
      /**
       * convert an abbreviation to a long string
       * @param  {String} abbr
       * @return {String}
       */
      unabbr: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        if (typeof nonabbrs !== 'undefined' && typeof nonabbrs[abbr] !== 'undefined' && typeof nonabbrs[abbr].name !== 'undefined' && nonabbrs[abbr].name !== '') {
          return nonabbrs[abbr].name || ''
        } else if (typeof abbrs[abbr] !== 'undefined') {
          return abbrs[abbr].name || ''
        } else {
          return ''
        }
      },
      /**
       * convert an abbreviation to a long string without SIngle Rope or Double Dutch in it
       * @param  {String} abbr
       * @return {String}
       */
      unabbrNoType: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        var unabbred = (nonabbrs ? nonabbrs[abbr].name || abbrs[abbr].name : abbrs[abbr].name)
        unabbred = unabbred.replace('Single Rope', '')
        unabbred = unabbred.replace('Double Dutch', '')
        return unabbred.trim()
      },
      /**
       * converts a standard abbr to a non-standard abbr from nonabbrs
       * should always be used for display purposes but never for internal purposes
       * @param  {String} abbr
       * @return {String}
       */
      abbr: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        if (nonabbrs) {
          return nonabbrs[abbr].abbr || abbr
        } else {
          return abbr
        }
      },
      /**
       * @return {String[]} Array of event abbrs
       */
      events: function () {
        return Object.keys(functions.nonabbrs() || abbrs)
      },
      /**
       * @return {String[]} Array sorted based on their weight, for tie resolver
       */
      weightedOrder: function () {
        var nonabbrs = functions.nonabbrs()
        var arr = Object.keys(nonabbrs || abbrs)
        var finalWeight = 100
        arr.push('final')
        arr = arr.sort(function (a, b) {
          var aw = 1
          var bw = 1

          if (typeof nonabbrs !== 'undefined' && typeof nonabbrs[a] !== 'undefined' && typeof nonabbrs[a].weigth !== 'undefined') {
            aw = nonabbrs[a].weight
          } else if (typeof abbrs[a] !== 'undefined' && typeof abbrs[a].weight !== 'undefined') {
            aw = abbrs[a].weight
          }

          if (typeof nonabbrs !== 'undefined' && typeof nonabbrs[b] !== 'undefined' && typeof nonabbrs[b].weigth !== 'undefined') {
            aw = nonabbrs[b].weight
          } else if (typeof abbrs[b] !== 'undefined' && typeof abbrs[b].weight !== 'undefined') {
            aw = abbrs[b].weight
          }
          if (a === 'final') {
            return bw - finalWeight
          }
          if (b === 'final') {
            return finalWeight - aw
          }

          var x, y

          if (typeof nonabbrs === 'undefined' || typeof nonabbrs[a] === 'undefined' || typeof nonabbrs[a].weight === 'undefined') {
            x = (typeof abbrs[a] === 'undefined' ? 0 : abbrs[a].weight)
          } else {
            x = nonabbrs[a].weight
          }

          if (typeof nonabbrs === 'undefined' || typeof nonabbrs[b] === 'undefined' || typeof nonabbrs[b].weight === 'undefined') {
            y = (typeof abbrs[b] === 'undefined' ? 0 : abbrs[b].weight)
          } else {
            y = nonabbrs[b].weight
          }

          return y - x
        }) // sort descending
        return arr
      },
      /**
       * @param  {String} abbr
       * @return {boolean}      if the event is a speed event or not
       */
      isSpeed: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        if (nonabbrs && nonabbrs[abbr]) {
          return nonabbrs[abbr].speed || abbrs[abbr].speed
        } else if (abbrs[abbr]) {
          return abbrs[abbr].speed
        } else {
          return false
        }
      },
      /**
       * @param  {String} abbr
       * @return {Boolean}      if the event is a team event or not
       */
      isTeam: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        if (typeof nonabbrs !== 'undefined' && typeof nonabbrs[abbr] !== 'undefined') {
          return !(nonabbrs[abbr].masters || abbrs[abbr].masters)
        } else if (abbrs[abbr]) {
          return !abbrs[abbr].masters
        } else {
          return false
        }
      },
      /**
       * is it single rope or double dutch, based on first two letters (dd/sr)
       * @param  {String} abbr
       * @param  {String} type dd or sr (or technically anything else...)
       * @return {Boolean}
       */
      isType: function (abbr, type) {
        var abbrType = abbr.substring(0, 2)
        return (abbrType.toLowerCase() === type.toLowerCase())
      },
      /**
       * @param  {Object} obj  Object with events as keys
       * @param  {String} type dd or sr
       * @return {Boolean}     object have at least one event of type type
       */
      hasType: function (obj, type) {
        if (!obj) {
          return false
        }
        var keys = Object.keys(obj)
        for (var i = 0; i < keys.length; i++) {
          if (obj[keys[i]] && functions.isType(keys[i], type.toLowerCase())) {
            return true
          }
        }
        return false
      },
      /**
       * @param  {Object} obj Object with events as keys
       * @return {Boolean}    if the object includes at least one team event
       */
      hasTeams: function (obj) {
        if (!obj) {
          return false
        }
        var keys = Object.keys(obj)
        for (var i = 0; i < keys.length; i++) {
          if (obj[keys[i]] && functions.isTeam(keys[i])) {
            return true
          }
        }
        return false
      },
      /**
       * @param  {Object} obj Object with events as keys
       * @return {Boolean}    if the object includes at least one speed event
       */
      hasSpeed: function (obj) {
        if (!obj) {
          return false
        }
        var keys = Object.keys(obj)
        for (var i = 0; i < keys.length; i++) {
          if (obj[keys[i]] && functions.isSpeed(keys[i])) {
            return true
          }
        }
        return false
      },
      /**
       * @param  {Object} obj Object with events as keys
       * @return {Boolean}    if the object includes at least one freestyle event
       */
      hasFreestyle: function (obj) {
        if (!obj) {
          return false
        }
        var keys = Object.keys(obj)
        for (var i = 0; i < keys.length; i++) {
          if (obj[keys[i]] && !functions.isSpeed(keys[i])) {
            return true
          }
        }
        return false
      },
      /**
       * @param  {Object} obj   object with events as keys and if enabled as property
       * @param  {?String} type sr, dd...
       * @return {Number}       number of enabled events ot type type
       */
      count: function (obj, type) {
        if (!obj) {
          return 0
        }
        var keys = Object.keys(obj)
        var sum = 0
        if (type) {
          var i
          for (i = 0; i < keys.length; i++) {
            if (functions.isType(keys[i], type) && obj[keys[i]]) {
              sum++
            }
          }
        } else {
          for (i = 0; i < keys.length; i++) {
            if (obj[keys[i]]) {
              sum++
            }
          }
        }
        return sum
      },
      /**
       * Get the factor to multiply a speed score with, should move to Abbr
       * @param  {String} event
       * @return {Number}
       */
      speedFactor: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        if (typeof nonabbrs !== 'undefined' && typeof nonabbrs[abbr] !== 'undefined') {
          return nonabbrs[abbr].speedFactor || 1
        } else if (typeof abbrs[abbr] !== 'undefined') {
          return abbrs[abbr].speedFactor || 1
        } else {
          return 1
        }
      }
    }

    return functions
  })

  .factory('Num',
    function () {
      /**
       * @param  {?Number} num
       * @return {Undefined[]} An array of length num or length 0 in number isn't specified
       */
      return function (num) {
        if (num) {
          return new Array(num)
        } else {
          return []
        }
      }
    })

  .factory('Display', function ($rootScope, Abbr, Db) {
    return {
      /**
       * adds a participant's score in event from category id to the object to be displayed
       * @param  {String} uid   poarticipant id
       * @param  {String} id    category id
       * @param  {String} event
       * @return {Undefined}
       */
      display: function (uid, id, event) {
        var data = Db.get()
        if (typeof data.globconfig === 'undefined') {
          data.globconfig = {}
        }
        if (typeof data.globconfig.display === 'undefined' || id !== data.globconfig.display.id) {
          data.globconfig.display = {}
        }
        if (typeof data.globconfig.display.events === 'undefined') {
          data.globconfig.display.events = []
        }

        data.globconfig.display.id = id
        data.globconfig.display.speed = Abbr.isSpeed(event)
        if (Abbr.isSpeed(event)) {
          var child = {
            uid: uid,
            event: event
          }
          var ioc = data.globconfig.display.events.findIndex(
            function (obj) {
              return obj.uid === uid && obj.event === event
            })
          if (ioc !== -1) {
            data.globconfig.display.events.splice(ioc, 1)
          }
          data.globconfig.display.events.push(child)
        } else {
          data.globconfig.display.event = {
            uid: uid,
            event: event
          }
        }
        Db.set(data)
      },
      /**
       * adds multiple participant's scores in event from category id to the object to be displayed
       * @param  {Object} participants  object with participants id's as keys
       * @param  {String} id            category id
       * @param  {String} events
       * @return {Undefined}
       */
      displayAll: function (participants, id, events) {
        var i
        for (i = 0; i < events.length; i++) {
          if (!Abbr.isSpeed(events[i])) throw new Error('this function can only be used on multiple speed events')
        }

        var data = Db.get()
        if (typeof data.globconfig === 'undefined') {
          data.globconfig = {}
        }
        if (typeof data.globconfig.display === 'undefined' || id !== data.globconfig.display.id) {
          data.globconfig.display = {}
        }
        if (typeof data.globconfig.display.events === 'undefined') { data.globconfig.display.events = [] }
        data.globconfig.display.id = id
        data.globconfig.display.speed = true

        for (i = 0; i < events.length; i++) {
          var event = events[i]

          for (var j = 0; j < participants.length; j++) {
            var child = {
              uid: participants[j],
              event: event
            }
            // remove old same copy
            var ioc = data.globconfig.display.events.findIndex(function (obj) {
              return obj.uid === participants[j] && obj.event === event
            })
            if (ioc !== -1) {
              data.globconfig.display.events.splice(ioc, 1)
            }
            data.globconfig.display.events.push(child)
          }
        }

        data.globconfig.display.events = data.globconfig.display.events.filter(function (event) {
          return (typeof data[id].scores !== 'undefined' && typeof data[id].scores[event.uid] !== 'undefined' && typeof data[id].scores[event.uid][event.event] !== 'undefined')
        })

        Db.set(data)
      }
    }
  })

  .factory('Live', function ($rootScope, $http, $timeout, Db, Abbr, Config, Calc, Notif) {
    $rootScope.networkStatus = {
      scores: false,
      participants: false,
      config: false
    }
    var checker = function (data, id) {
      let msg
      if (typeof $rootScope.liveConfig === 'undefined' ||
          !$rootScope.liveConfig.federation) msg = 'federation not set'
      if (typeof $rootScope.liveConfig === 'undefined' ||
          !$rootScope.liveConfig.apikey) msg = 'apikey not set'

      if (typeof msg !== 'undefined') {
        $rootScope.networkError = msg
        $timeout(function () {
          $rootScope.networkError = ''
        }, 7500)
        return msg
      }

      if (!data[id].config.live) msg = 'Category not configured for RSLive'
      if (typeof msg !== 'undefined') return msg
    }
    return {
      scores: function (id) {
        let start = performance.now()
        return new Promise(function (resolve, reject) {
          let data = Db.get()
          let chk = checker(data, id)
          if (typeof chk !== 'undefined') return resolve(chk)
          let url = $rootScope.liveConfig.url || Config.Live.URL

          $rootScope.networkStatus.scores = true

          let bodies = {}
          let results = Calc.results(data[id])

          if (typeof results === 'undefined') return reject(new Error('error calculating scores'))

          for (let part of results.partArray) {
            let overall = {
              uid: part.uid,
              events: []
            }
            for (let abbr of Abbr.events()) {
              if (typeof bodies[abbr] === 'undefined' && data[id].config.subevents[abbr] === true) bodies[abbr] = {scores: []}
              let event = {
                uid: part.uid
              }
              let overallEvent = {
                abbr: abbr
              }

              if (typeof results.finalscores[part.uid] === 'undefined' ||
                  typeof results.finalscores[part.uid][abbr] === 'undefined' ||
                  typeof results.ranks[abbr] === 'undefined' ||
                  typeof results.ranks[abbr][part.uid] === 'undefined' ||
                  Object.keys(results.finalscores[part.uid][abbr]).length === 0) {
                if (typeof data[id].scores[part.uid] !== 'undefined' &&
                    typeof data[id].scores[part.uid][abbr] !== 'undefined' &&
                    data[id].scores[part.uid][abbr].dns === true) {
                  event.dns = true
                } else {
                  event.delete = true
                }
                if (typeof bodies[abbr] !== 'undefined') bodies[abbr].scores.push(event)
                continue
              }

              let score = results.finalscores[part.uid][abbr]
              let overallScore = (results.overallFinalscores[part.uid] || {})[abbr] || {}
              let rank = results.ranks[abbr][part.uid]
              let overallRank = (results.overallRanks[abbr] || {})[part.uid] || {}

              if (typeof score.T1 !== 'undefined') event.T1 = Math.roundTo(score.T1, 2)
              if (typeof score.T2 !== 'undefined') event.T2 = Math.roundTo(score.T2, 2)
              if (typeof score.T3 !== 'undefined') event.T3 = Math.roundTo(score.T3, 2)
              if (typeof score.T4 !== 'undefined') event.T4 = Math.roundTo(score.T4, 2)
              if (typeof score.T5 !== 'undefined') event.T5 = Math.roundTo(score.T5, 2)
              if (typeof overallScore.T1 !== 'undefined') overallEvent.T1 = Math.roundTo(overallScore.T1, 2)
              if (typeof overallScore.T2 !== 'undefined') overallEvent.T2 = Math.roundTo(overallScore.T2, 2)
              if (typeof overallScore.T3 !== 'undefined') overallEvent.T3 = Math.roundTo(overallScore.T3, 2)
              if (typeof overallScore.T4 !== 'undefined') overallEvent.T4 = Math.roundTo(overallScore.T4, 2)
              if (typeof overallScore.T5 !== 'undefined') overallEvent.T5 = Math.roundTo(overallScore.T5, 2)

              if (typeof score.T4 !== 'undefined' && typeof score.T5 !== 'undefined') event.cScore = Math.roundTo(score.T4 - (score.T5 / 2), 2)
              if (typeof score.T1 !== 'undefined' && typeof score.T5 !== 'undefined') event.dScore = Math.roundTo(score.T1 - (score.T5 / 2), 2)
              if (typeof overallScore.T4 !== 'undefined' && typeof overallScore.T5 !== 'undefined') overallEvent.cScore = Math.roundTo(overallScore.T4 - (overallScore.T5 / 2), 2)
              if (typeof overallScore.T1 !== 'undefined' && typeof overallScore.T5 !== 'undefined') overallEvent.dScore = Math.roundTo(overallScore.T1 - (overallScore.T5 / 2), 2)

              if (typeof score.PreA !== 'undefined') event.PreA = Math.roundTo(score.PreA, 2)
              if (typeof score.PreY !== 'undefined') event.PreY = Math.roundTo(score.PreY, 2)
              if (typeof overallScore.PreA !== 'undefined') overallEvent.PreA = Math.roundTo(overallScore.PreA, 2)
              if (typeof overallScore.PreY !== 'undefined') overallEvent.PreY = Math.roundTo(overallScore.PreY, 2)

              if (typeof score.A !== 'undefined') event.A = Math.roundTo(score.A, 2)
              if (typeof score.Y !== 'undefined') event.Y = Math.roundTo(score.Y, 2)
              if (typeof overallScore.A !== 'undefined') overallEvent.A = Math.roundTo(overallScore.A, 2)
              if (typeof overallScore.Y !== 'undefined') overallEvent.Y = Math.roundTo(overallScore.Y, 2)

              if (typeof rank.total !== 'undefined' && typeof rank.total.cRank !== 'undefined') event.cRank = Math.roundTo(rank.total.cRank, 2)
              if (typeof rank.total !== 'undefined' && typeof rank.total.dRank !== 'undefined') event.dRank = Math.roundTo(rank.total.dRank, 2)
              if (typeof rank.total !== 'undefined' && typeof rank.total.cRank !== 'undefined' && typeof rank.total.dRank !== 'undefined') event.rsum = Math.roundTo(rank.total.cRank + rank.total.dRank, 2)
              if (typeof rank.total !== 'undefined' && typeof rank.total.rank !== 'undefined') event.rank = Math.roundTo(rank.total.rank, 2)
              if (typeof rank.rank !== 'undefined') event.rank = Math.roundTo(rank.rank, 2)
              if (typeof overallRank.total !== 'undefined' && typeof overallRank.total.cRank !== 'undefined') overallEvent.cRank = Math.roundTo(overallRank.total.cRank, 2)
              if (typeof overallRank.total !== 'undefined' && typeof overallRank.total.dRank !== 'undefined') overallEvent.dRank = Math.roundTo(overallRank.total.dRank, 2)
              if (typeof overallRank.total !== 'undefined' && typeof overallRank.total.cRank !== 'undefined' && typeof overallRank.total.dRank !== 'undefined') overallEvent.rsum = Math.roundTo(overallRank.total.cRank + overallRank.total.dRank, 2)
              if (typeof overallRank.total !== 'undefined' && typeof overallRank.total.rank !== 'undefined') overallEvent.rank = Math.roundTo(overallRank.total.rank, 2)
              if (typeof overallRank.rank !== 'undefined') overallEvent.rank = Math.roundTo(overallRank.rank, 2)

              if (Object.keys(event).length === 1) event.delete = true
              if (Object.keys(overallEvent).length > 1) overall.events.push(overallEvent)
              bodies[abbr].scores.push(event)
            }

            if (typeof results.overallFinalscores[part.uid] !== 'undefined' && typeof results.overallFinalscores[part.uid].final !== 'undefined') overall.score = Math.roundTo(results.overallFinalscores[part.uid].final, 2)
            if (typeof results.overallRanksums[part.uid] !== 'undefined') overall.rsum = Math.roundTo(results.overallRanksums[part.uid], 2)
            if (typeof results.overallFinalRanks[part.uid] !== 'undefined') overall.rank = Math.roundTo(results.overallFinalRanks[part.uid], 2)

            if (typeof bodies.overall === 'undefined') bodies.overall = {scores: []}
            if (overall.events.length === 0) overall.delete = true
            bodies.overall.scores.push(overall)
          }

          let end = performance.now()
          console.log('HTTP body preparation took ' + Math.roundTo(end - start, 2) + ' milliseconds.')

          console.log('RSLive scores', bodies)
          let bodyAbbrs = Object.keys(bodies)
          let promises = []
          for (let event of bodyAbbrs) {
            promises.push($http.post(url + '/' + $rootScope.liveConfig.federation + '/' + id + '/scores/' + event, bodies[event], {
              headers: {
                'Authorization': 'Bearer ' + $rootScope.liveConfig.apikey
              }
            }))
            promises[promises.length - 1].then(function (response) {
              console.log(response.status, response.data.message)
              Notif('RopeScore Live', response.data.message, 'success', 1500)
            }, function (response) {
              console.log(response.status, response.data.message)
              Notif('RopeScore Live', response.data.message, 'error')
            }).catch(function (err) {
              console.log(err)
              reject(err)
            })
          }
          Promise.all(promises).then(function (messages) {
            resolve(messages)
          }).catch(function (err) {
            reject(err)
          })
        }).then(function (msg) {
          $rootScope.networkStatus.scores = false
          $rootScope.$apply()
          // console.log(msg)
        }).catch(function (err) {
          $rootScope.networkStatus.scores = false
          $rootScope.$apply()
          if (err) throw err
        })
      },
      participants: function (id) {
        return new Promise(function (resolve, reject) {
          let data = Db.get()
          let chk = checker(data, id)
          if (typeof chk !== 'undefined') return resolve(chk)

          let url = $rootScope.liveConfig.url || Config.Live.URL

          $rootScope.networkStatus.participants = true

          var body = {
            participants: Object.keys(data[id].participants).map(function (uid) {
              return {
                uid: uid,
                name: data[id].participants[uid].name,
                club: data[id].participants[uid].club,
                members: data[id].participants[uid].members
              }
            })
          }

          console.log('RSLive participants', body)
          $http.post(url + '/' + $rootScope.liveConfig.federation + '/' + id + '/participants', body, {
            headers: {
              'Authorization': 'Bearer ' + $rootScope.liveConfig.apikey
            }
          }).then(function (response) {
            console.log(response.status, response.data.message)
            Notif('RopeScore Live', response.data.message, 'success', 1500)
            resolve(response.status + ' ' + response.data.message)
          }, function (response) {
            console.log(response.status, response.data.message)
            Notif('RopeScore Live', response.data.message, 'error')
            reject(new Error(response.status + ' ' + response.data.message))
          }).catch(function (err) {
            reject(err)
          })
        }).then(function (msg) {
          $rootScope.networkStatus.participants = false
          $rootScope.$apply()
        }).catch(function (err) {
          $rootScope.networkStatus.participants = false
          $rootScope.$apply()
          if (err) throw err
        })
      },
      config: function (id) {
        return new Promise(function (resolve, reject) {
          let data = Db.get()
          let chk = checker(data, id)
          if (typeof chk !== 'undefined') return resolve(chk)
          let url = $rootScope.liveConfig.url || Config.Live.URL

          $rootScope.networkStatus.config = true

          let cols = (data[id].config.simplified ? Config.SimplResultsCols || Config.ResultsCols : Config.ResultsCols)
          let body = {
            name: data[id].config.name,
            events: Object.keys(data[id].config.subevents || {}).filter(function (abbr) {
              return data[id].config.subevents[abbr]
            }).map(function (abbr) {
              let obj = {
                abbr: abbr,
                name: Abbr.unabbr(abbr),
                speed: Abbr.isSpeed(abbr),
                cols: {
                  overall: [],
                  event: []
                }
              }

              obj.cols.overall = Object.keys(cols.overall[(obj.speed ? 'speed' : 'freestyle')]).filter(function (abbr) {
                return cols.overall[(obj.speed ? 'speed' : 'freestyle')][abbr]
              })
              obj.cols.event = Object.keys(cols.events[(obj.speed ? 'speed' : 'freestyle')]).filter(function (abbr) {
                return cols.events[(obj.speed ? 'speed' : 'freestyle')][abbr]
              })

              return obj
            })
          }

          console.log('RSLive config', body)
          $http.post(url + '/' + $rootScope.liveConfig.federation + '/' + id, body, {
            headers: {
              'Authorization': 'Bearer ' + $rootScope.liveConfig.apikey
            }
          }).then(function (response) {
            console.log(response.status, response.data.message)
            Notif('RopeScore Live', response.data.message, 'success', 1500)
            resolve(response.status + ' ' + response.data.message)
          }, function (response) {
            console.log(response.status, response.data.message)
            Notif('RopeScore Live', response.data.message, 'error')
            reject(new Error(response.status + ' ' + response.data.message))
          }).catch(function (err) {
            reject(err)
          })
        }).then(function (msg) {
          $rootScope.networkStatus.config = false
          $rootScope.$apply()
        }).catch(function (err) {
          $rootScope.networkStatus.config = false
          $rootScope.$apply()
          if (err) throw err
        })
      },
      delete: function (id) {
        return new Promise(function (resolve, reject) {
          let data = Db.get()
          let chk = checker(data, id)
          if (typeof chk !== 'undefined') return resolve(chk)
          let url = $rootScope.liveConfig.url || Config.Live.URL

          $rootScope.networkStatus.config = true

          console.log('Queuing category ' + id + 'for removal from RSLive')
          $http.delete(url + '/' + $rootScope.liveConfig.federation + '/' + id, {
            headers: {
              'Authorization': 'Bearer ' + $rootScope.liveConfig.apikey
            }
          }).then(function (response) {
            console.log(response.status, response.data.message)
            Notif('RopeScore Live', response.data.message, 'success', 1500)
            resolve(response.status + ' ' + response.data.message)
          }, function (response) {
            console.log(response.status, response.data.message)
            Notif('RopeScore Live', response.data.message, 'error')
            reject(new Error(response.status + ' ' + response.data.message))
          }).catch(function (err) {
            reject(err)
          })
        }).then(function (msg) {
          $rootScope.networkStatus.config = false
          $rootScope.$apply()
        }).catch(function (err) {
          $rootScope.networkStatus.config = false
          $rootScope.$apply()
          if (err) throw err
        })
      }
    }
  })

  .directive('ngConfirmClick', [
    function () {
      return {
        /**
         * gives a confirm prompt before executing the action
         * @param  {Object} scope
         * @param  {Object} element
         * @param  {Object} attr
         * @return {Undefined}
         */
        link: function (scope, element, attr) {
          var msg = attr.ngConfirmClick || 'Are you sure?'
          var clickAction = attr.confirmedClick
          element.bind('click', function (event) {
            if (window.confirm(msg)) {
              scope.$eval(clickAction)
            }
          })
        }
      }
    }
  ])
