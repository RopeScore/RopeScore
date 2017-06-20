'use strict';

Math.roundTo = function(n, digits) {
  digits = digits || 0;
  var init = n;

  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator));
  var test = (Math.round(n) / multiplicator);
  //console.log(`rounded ${init} to ${test}`)
  return test;
}

var errorSocket = new WebSocket("ws://localhost:3333/errors");
errorSocket.onmessage = function(evt) {
  console.log('backend error:', JSON.parse(evt.data))
}

/*var tableToExcel = (function() {
  var uri = 'data:application/vnd.ms-excel;base64,',
    template =
    '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--><meta http-equiv="content-type" content="text/plain; charset=UTF-8"/></head><body><table>{table}</table></body></html>',
    base64 = function(s) {
      return window.btoa(unescape(encodeURIComponent(s)))
    },
    format = function(s, c) {
      return s.replace(/{(\w+)}/g, function(m, p) {
        return c[p];
      })
    }
  return function(table, name) {
    if (!table.nodeType) table = document.getElementById(table)
    var ctx = {
      worksheet: name || 'Worksheet',
      table: table.innerHTML
    }
    console.log('saving excel table')
    window.location.href = uri + base64(format(template, ctx))
  }
})()*/

/**
 * @namespace ropescore
 * @requires ngRoute
 */
angular.module('ropescore', [
  'ngRoute',
  'ropescore.dash',
  'ropescore.config',
  'ropescore.config.participants',
  'ropescore.event',
  'ropescore.score',
  'ropescore.results',
  'ropescore.about.licence',
  'ropescore.about.docs',
  'ropescore.bugreport',
  'Config'
])

  .config([
    '$locationProvider', '$routeProvider', '$compileProvider',
    function($locationProvider, $routeProvider, $compileProvider) {
      /**
       * @description ngRoute with html5 mode (no hashbang, but with fallback)
       * @memberOf ropescore.ropescore
       */
      $locationProvider.html5Mode(true)
        .hashPrefix('!');

      $routeProvider.otherwise({
        redirectTo: '/'
      });

      $compileProvider.aHrefSanitizationWhitelist(
        /^\s*(https?:|ftp:|mailto:|data:application\/json)/);
    }
  ])

  .run(function($location, $rootScope, Db, Config) {
    /**
     * @name $rootScope.goHome
     * @function
     * @memberOf ropescore
     * @description function to go to /
     */
    $rootScope.goHome = function() {
      $location.path('/');
    };

    $rootScope.setID = function(id) {
      console.log(`id: ${id}`)
      $rootScope.id = id;
    }

    $rootScope.copyright = function() {
      if (new Date()
        .getFullYear() == 2017) {
        return 2017;
      } else {
        return "2017-" + ((new Date())
          .getFullYear());
      }
    }
    $rootScope.version = Config.version

    $rootScope.$on('$routeChangeStart', function(next, current) {
      console.log(`Navigated to ${$location.path()}`)
    });
  })

  .factory("Db",
    /**
     * @function Db
     * @memberOf ropescore.ropescore
     * @return {object} Return database
     */
    function() {
      return {
        get: function() {
          console.log('got data from database')
          return store.get('ropescore') || {}
        },
        set: function(newData) {
          console.log('saved data to databse')
          return store.set('ropescore', newData)
        },
        watch: function() {
          console.log('watching database for updates')
          store.watch('ropescore', function() {
            console.log("database updated")
            $rootScope.$apply();
          })
          return
        }
      }
    })

  .factory('tablesToExcel', function(Abbr) {
    return function(tables, name) {
      var wb = XLSX.utils.book_new();
      var wopts = {
        bookType: 'xlsx',
        bookSST: true,
        type: 'base64'
      };
      if (!wb.Props) wb.Props = {};
      wb.Props.Title = (name ? 'Results for ' + (name) + ' - ' : '') +
        'RopeScore';
      wb.Props.CreatedDate = new Date()
        .toISOString();
      var uri = 'data:application/octet-streaml;base64,'
      for (var i = 0; i < tables.length; i++) {
        var sheetName = (tables[i].getAttribute('name') == 'overall' ?
          'Overall' : Abbr.abbr(tables[i].getAttribute('name')) || (
            'Sheet' + (i + 1)))
        XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(tables[i], {
            cellStyles: true
          }),
          sheetName)
      }
      console.log(wb)
      var wbout = XLSX.write(wb, wopts);

      var link = document.createElement("a");
      link.download = 'ropescore' + (name ? '-' + (name) : '') + '.xlsx';
      link.href = uri + wbout;

      document.body.appendChild(link);
      link.click();

      // Cleanup the DOM
      document.body.removeChild(link);
      link = undefined;
      //window.location.href = uri + wbout;
    }
  })

  .factory("Abbr",

    function() {
      var abbrs = {
        srss: {
          name: "Single Rope Speed Sprint",
          masters: true,
          speed: true
        },
        srse: {
          name: "Single Rope Speed Endurance",
          masters: true,
          speed: true
        },
        srsf: {
          name: "Single Rope Single Freestyle",
          masters: true,
          speed: false
        },
        // ------------------
        srsr: {
          name: "Single Rope Speed Relay",
          masters: false,
          speed: true
        },
        srpf: {
          name: "Single Rope Pair Freestyle",
          masters: false,
          speed: false
        },
        srtf: {
          name: "Single Rope Team Freestyle",
          masters: false,
          speed: false
        },
        ddsr: {
          name: "Double Dutch Speed Relay",
          masters: false,
          speed: true
        },
        ddsf: {
          name: "Double Dutch Single Freestyle",
          masters: false,
          speed: false
        },
        ddpf: {
          name: "Double Dutch Pair Freestyle",
          masters: false,
          speed: false
        },
        // ------------------
        srp: {
          name: "Single Rope Triple Unders",
          masters: true,
          speed: true
        },
        srd: {
          name: "Single Rope Double Unders",
          masters: true,
          speed: true
        }
      };
      // fill in nonabbrs if you want to use non standard abbrs, add non-standard events here as well
      var nonabbrs = {
        srss: {
          abbr: "srm30s",
          name: "Masters 30s Speed"
        },
        srse: {
          abbr: "srm3min",
          name: "Masters 3 minutes Speed"
        },
        srsf: {
          abbr: "",
          name: ""
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
        },
        // ------------------
        srp: {
          abbr: "",
          name: ""
        },
        srd: {
          abbr: "srdr",
          name: "Single Rope Double Unders Relay"
        },
        // ------------------
        srsj: {
          abbr: "srs1min",
          name: "Masters 1 minute Speed",
          speed: true,
          masters: true
        }
      };

      var functions = {
        unabbr: function(abbr) {
          return nonabbrs[abbr].name || abbrs[abbr].name
        },
        abbr: function(abbr) {
          // converts a standard abbr to a non-standard abbr
          if (nonabbrs) {
            return nonabbrs[abbr].abbr || abbr
          } else {
            return abbr
          }
        },
        events: Object.keys(nonabbrs),
        isSpeed: function(abbr) {
          if (nonabbrs && nonabbrs[abbr]) {
            return nonabbrs[abbr].speed || abbrs[abbr].speed;
          } else if (abbrs[abbr]) {
            return abbrs[abbr].speed
          } else {
            return false;
          }
        },
        isTeam: function(abbr) {
          if (nonabbrs) {
            return !(nonabbrs[abbr].masters || abbrs[abbr].masters);
          } else if (abbrs[abbr]) {
            return abbrs[abbr].masters
          } else {
            return false;
          }
        },
        isType: function(abbr, type) {
          var abbrType = abbr.substring(0, 2);
          return (abbrType.toLowerCase() == type.toLowerCase())
        },
        hasType: function(obj, type) {
          if (!obj) {
            return false;
          }
          var keys = Object.keys(obj);
          for (var i = 0; i < keys.length; i++) {
            if (obj[keys[i]] && functions.isType(keys[i], type.toLowerCase())) {
              return true;
            }
          }
          return false;
        },
        hasTeams: function(obj) {
          if (!obj) {
            return false;
          }
          var keys = Object.keys(obj)
          for (var i = 0; i < keys.length; i++) {
            if (obj[keys[i]] && functions.isTeam(keys[i])) {
              return true;
            }
          }
          return false
        },
        hasSpeed: function(obj) {
          if (!obj) {
            return false;
          }
          var keys = Object.keys(obj)
          for (var i = 0; i < keys.length; i++) {
            if (obj[keys[i]] && functions.isSpeed(keys[i])) {
              return true;
            }
          }
          return false
        },
        hasFreestyle: function(obj) {
          if (!obj) {
            return false;
          }
          var keys = Object.keys(obj)
          for (var i = 0; i < keys.length; i++) {
            if (obj[keys[i]] && !functions.isSpeed(keys[i])) {
              return true;
            }
          }
          return false
        },
        count: function(obj, type) {
          if (!obj) {
            return 0;
          }
          var keys = Object.keys(obj);
          var sum = 0;
          if (type) {
            for (var i = 0; i < keys.length; i++) {
              if (functions.isType(keys[i], type) && obj[keys[i]]) {
                sum++
              }
            }
          } else {
            for (var i = 0; i < keys.length; i++) {
              if (obj[keys[i]]) {
                sum++
              }
            }
          }
          return sum;
        },
        header: function(obj, type, DC) {
          if (!obj) {
            return 0;
          }
          var keys = Object.keys(obj);
          var sum = 0;
          if (type) {
            for (var i = 0; i < keys.length; i++) {
              if (functions.isType(keys[i], type) && obj[keys[i]]) {
                sum += (!DC || functions.isSpeed(keys[i]) ? 2 : 6)
              }
            }
          } else {
            for (var i = 0; i < keys.length; i++) {
              if (obj[keys[i]]) {
                sum += (!DC || functions.isSpeed(keys[i]) ? 2 : 6)
              }
            }
          }
          return sum;
        }
      }

      return functions;
    })

  .factory("Num",
    function() {
      return function(num) {
        if (num) {
          return new Array(num);
        } else {
          return [];
        }
      }
    })

  .directive('ngConfirmClick', [
    function() {
      return {
        link: function(scope, element, attr) {
          var msg = attr.ngConfirmClick || "Are you sure?";
          var clickAction = attr.confirmedClick;
          element.bind('click', function(event) {
            if (window.confirm(msg)) {
              scope.$eval(clickAction)
            }
          });
        }
      }
    }
  ])
