/* global angular, WebSocket, store, XLSX, sha1 */
'use strict'

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

var errorSocket = new WebSocket('ws://localhost:3333/errors')
errorSocket.onmessage = function (evt) {
  var data = JSON.parse(evt.data)
  if (data.type === 'update') return
  console.log('backend error:', data)
}

var dbSocket = new WebSocket('ws://localhost:3333/db')
dbSocket.onmessage = function (evt) {
  var data = JSON.parse(evt.data)
  if (data.type !== 'update') return
  console.log('Update')
}

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
      $locationProvider.html5Mode(true)
        .hashPrefix('!')

      $routeProvider.otherwise({
        redirectTo: '/'
      })

      $compileProvider.aHrefSanitizationWhitelist(
        /^\s*(https?:|ftp:|mailto:|data:application\/json)/)
    }
  ])

  .run(function ($location, $route, $rootScope, Db, Config) {
    /**
     * @name $rootScope.goHome
     * @function
     * @memberOf ropescore
     * @description function to go to /
     */
    $rootScope.goHome = function () {
      $location.path('/')
    }

    $rootScope.reload = function () {
      $route.reload()
    }

    $rootScope.setID = function (id) {
      console.log(`id: ${id}`)
      $rootScope.id = id
    }

    $rootScope.copyright = function () {
      if (new Date().getFullYear() === 2017) {
        return 2017
      } else {
        return '2017-' + ((new Date()).getFullYear())
      }
    }
    $rootScope.version = Config.version

    $rootScope.$on('$routeChangeStart', function (next, current) {
      console.log(`Navigated to ${$location.path()}`)
    })
  })

  .factory('Db',
    /**
     * @function Db
     * @memberOf ropescore.ropescore
     * @return {object} Return database
     */
    function ($rootScope, $q) {
      var methods = {
        get: function () {
          console.log('got data from database')
          return store.get('ropescore') || {}
        },
        set: function (newData) {
          console.log('saved data to databse')
          store.set('ropescore', newData)
          methods.data = methods.get()
          return dbSocket.send('{"type":"update"}')
        }
      }
      methods.data = methods.get()

      dbSocket.onmessage = function (evt) {
        var data = JSON.parse(evt.data)
        if (data.type !== 'update') return
        console.log('Update ng')

        methods.data = methods.get()
      }
      return methods
    })

  .factory('tablesToExcel', function (Abbr) {
    return function (tables, name) {
      var wb = XLSX.utils.book_new()
      var wopts = {
        bookType: 'xlsx',
        bookSST: true,
        type: 'base64'
      }
      if (!wb.Props) wb.Props = {}
      wb.Props.Title = (name ? 'Results for ' + (name) + ' - ' : '') +
        'RopeScore'
      wb.Props.CreatedDate = new Date()
        .toISOString()
      var uri = 'data:application/octet-streaml;base64,'
      for (var i = 0; i < tables.length; i++) {
        var sheetName = (tables[i].getAttribute('name') === 'overall' ? 'Overall' : Abbr.abbr(tables[i].getAttribute('name')) || ('Sheet' + (i + 1)))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(tables[i], {
          cellStyles: true
        }),
          sheetName)
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
    return function (obj, n = 5) {
      var string = (obj ? JSON.stringify(obj) : '')
      var hash = sha1(string)
      var o = Config.CheckStart
      var checksum = hash.substring(o, o + n)
      return checksum
    }
  })

  .factory('Abbr', function (Config) {
    var abbrs = {
      srss: {
        name: 'Single Rope Speed Sprint',
        weight: 0,
        masters: true,
        speed: true
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
        speed: true
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
        speed: true
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
      nonabbrs: function () {
        return Config.Nonabbrs || abbrs
      },
      unabbr: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        return (nonabbrs ? nonabbrs[abbr].name || abbrs[abbr].name : abbrs[abbr].name)
      },
      unabbrNoType: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        var unabbred = (nonabbrs ? nonabbrs[abbr].name || abbrs[abbr].name : abbrs[abbr].name)
        unabbred = unabbred.replace('Single Rope ', '')
        unabbred = unabbred.replace('Double Dutch ', '')
        return unabbred
      },
      abbr: function (abbr) {
        // converts a standard abbr to a non-standard abbr
        var nonabbrs = functions.nonabbrs()
        if (nonabbrs) {
          return nonabbrs[abbr].abbr || abbr
        } else {
          return abbr
        }
      },
      events: function () {
        return Object.keys(functions.nonabbrs() || abbrs)
      },
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
          return (nonabbrs[b].weight || abbrs[b].weight) - (nonabbrs[a].weight || abbrs[a].weight)
        }) // sort descending
        return arr
      },
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
      isTeam: function (abbr) {
        var nonabbrs = functions.nonabbrs()
        if (nonabbrs) {
          return !(nonabbrs[abbr].masters || abbrs[abbr].masters)
        } else if (abbrs[abbr]) {
          return abbrs[abbr].masters
        } else {
          return false
        }
      },
      isType: function (abbr, type) {
        var abbrType = abbr.substring(0, 2)
        return (abbrType.toLowerCase() === type.toLowerCase())
      },
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
      }
    }

    return functions
  })

  .factory('Num',
    function () {
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
