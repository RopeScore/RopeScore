/* global angular, WebSocket, lsbridge, store, XLSX, sha1 */
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

  .run(function ($location, $route, $rootScope, Db, Config) {
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

    /** generate copyright text */
    $rootScope.copyright = function () {
      return '2017-' + ((new Date()).getFullYear())
    }
    $rootScope.version = Config.version
    $rootScope.Ruleset = Config.Ruleset

    $rootScope.$on('$routeChangeStart', function (next, current) {
      console.log(`Navigated to ${$location.path()}`)
    })
  })

  .factory('Db',
    function ($rootScope, $q) {
      var methods = {
        /**
         * @return {Object} contents of database
         */
        get: function () {
          console.log('got data from database')
          return store.get('ropescore') || {}
        },
        /**
         * Overwrite database with new data
         * @param  {Object} newData
         * @return {Promise}        sending data update message to backend via socket
         */
        set: function (newData) {
          console.log('saved data to databse')
          store.set('ropescore', newData)
          methods.data = methods.get()
          lsbridge.send('ropescore-updates', { type: 'update' })
          // return dbSocket.send('{"type":"update"}')
        }
      }
      /**
       * @type {Object} contents of databse
       */
      methods.data = methods.get()

      lsbridge.subscribe('ropescore-updates', function (data) {
        if (data.type !== 'update') return
        console.log('Update ng')

        methods.data = methods.get()
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
      var scope = obj
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

  .factory('tablesToExcel', function (Abbr) {
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
        var sheetName = (tables[i].getAttribute('name') === 'overall' ? 'Overall' : Abbr.abbr(tables[i].getAttribute('name')) || ('Sheet' + (i + 1)))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(tables[i], {
          cellStyles: true
        }), sheetName)
      }
      console.log(wb)
      var wbout = XLSX.write(wb, wopts)

      var link = document.createElement('a')
      link.download = 'ropescore' + (name ? '-' + (name) : '') + '.xlsx'
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
        return (nonabbrs ? nonabbrs[abbr].name || abbrs[abbr].name : abbrs[abbr].name)
      },
      /**
       * convert an abbreviation to a long string without SIngle Rope or Double Dutch in it
       * @param  {String} abbr
       * @return {String}
       */
      unabbrNoType: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        var unabbred = (nonabbrs ? nonabbrs[abbr].name || abbrs[abbr].name : abbrs[abbr].name)
        unabbred = unabbred.replace('Single Rope ', '')
        unabbred = unabbred.replace('Double Dutch ', '')
        return unabbred
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
          if (a === 'final') {
            return (nonabbrs[b].weight || abbrs[b].weight) - finalWeight
          }
          if (b === 'final') {
            return finalWeight - (nonabbrs[a].weight || abbrs[a].weight)
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
          return abbrs[abbr].masters
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
       * @param  {Object} obj  object with event as keys and enabled bool as property
       * @param  {Strin} type  dd, sr...
       * @param  {Boolean} DC  if all coulmns should be displayed
       * @return {Number}      number of Columns the header should span
       */
      header: function (obj, type, DC) {
        if (!obj) {
          return 0
        }
        var keys = Object.keys(obj)
        var sum = 0
        if (type) {
          var i
          for (i = 0; i < keys.length; i++) {
            if (functions.isType(keys[i], type) && obj[keys[i]]) {
              sum += (!DC || functions.isSpeed(keys[i]) ? 2 : 10)
            }
          }
        } else {
          for (i = 0; i < keys.length; i++) {
            if (obj[keys[i]]) {
              sum += (!DC || functions.isSpeed(keys[i]) ? 2 : 10)
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
        return (nonabbrs ? nonabbrs[abbr].speedFactor || abbrs[abbr].speedFactor || 1 : abbrs[abbr].speedFactor) || 1
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
       * @param  {String} event
       * @return {Undefined}
       */
      displayAll: function (participants, id, event) {
        if (!Abbr.isSpeed(event)) throw new Error('this function can only be used on multiple speed events')

        var data = Db.get()
        var keys = Object.keys(participants)
        if (typeof data.globconfig === 'undefined') {
          data
          .globconfig = {}
        }
        if (typeof data.globconfig.display === 'undefined' || id !==
          data.globconfig.display.id) {
          data
          .globconfig.display = {}
        }
        if (typeof data.globconfig.display.events === 'undefined') { data.globconfig.display.events = [] }

        data.globconfig.display.id = id
        data.globconfig.display.speed = true
        for (var i = 0; i < keys.length; i++) {
          var child = {
            uid: keys[i],
            event: event
          }
          var ioc = data.globconfig.display.events.findIndex(
            function (obj) {
              return obj.uid === keys[i] && obj.event === event
            })
          if (ioc !== -1) {
            data.globconfig.display.events.splice(ioc, 1)
          }
          data.globconfig.display.events.push(child)
        }
        Db.set(data)
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
