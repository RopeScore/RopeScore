'use strict';

Math.roundTo = function(n, digits) {
  digits = digits || 0;

  var multiplicator = Math.pow(10, digits);
  n = parseFloat((n * multiplicator));
  var test = (Math.round(n) / multiplicator);
  return test;
}

var tableToExcel = (function() {
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
    window.location.href = uri + base64(format(template, ctx))
  }
})()

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
  'ropescore.about.licence'
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

  .run(function($location, $rootScope, Db) {
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
      $rootScope.id = id;
    }

    $rootScope.copyright = function() {
      if (new Date()
        .getFullYear() == 2017) {
        return 2017;
      } else {
        return "2017-" + new Date()
          .getFullYear();
      }
    }

    /* still dreaming about autoupdate...
      store.watch('ropescore', function() {
      console.log(store.get('ropescore'))
      $rootScope.data = store.get('ropescore')
    })*/
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
          return store.get('ropescore') || {}
        },
        set: function(newData) {
          return store.set('ropescore', newData)
        }
      }
    })

  .factory("Abbr",

    function() {
      var abbrs = {
        srss: "Single Rope Speed Sprint",
        srse: "Single Rope Speed Endurance",
        srsf: "Single Rope Single Freestyle",

        srsr: "Single Rope Speed Relay",
        ddsr: "Double Dutch Speed Relay",
        srpf: "Single Rope Pair Freestyle",
        srtf: "Single Rope Team Freestyle",
        ddsf: "Double Dutch Single Freestyle",
        ddpf: "Double Dutch Pair Freestyle",

        srp: "Single Rope Triple Unders",
        srd: "Single Rope Double Unders"
      };
      // uncomment nonabbrs if you want to use non standard abbrs
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
        ddsr: {
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
        }
      };
      var speedEvents = ['srss', 'srse', 'srsr', 'ddsr', 'srp', 'srd'];
      var masterEvents = ['srss', 'srse', 'srsf', 'srp', 'srd'];

      return {
        unabbr: function(abbr) {
          return nonabbrs[abbr].name || abbrs[abbr]
        },
        abbr: function(abbr) {
          // converts a standard abbr to a non-standard abbr
          if(nonabbrs) {
            return nonabbrs[abbr].abbr || abbr
          } else {
            return abbr
          }
        },
        events: Object.keys(abbrs),
        isSpeed: function(abbr) {
          return (speedEvents.indexOf(abbr) >= 0);
        },
        isSR: function(abbr) {
          var type = abbr.substring(0, 2);
          return (type.toLowerCase() == "sr")
        },
        isTeam: function(abbr) {
          return (masterEvents.indexOf(abbr) < 0)
        },
        hasSR: function(obj) {
          if (!obj) {
            return false;
          }
          var keys = Object.keys(obj);
          for (var i = 0; i < keys.length; i++) {
            var type = keys[i].substring(0, 2);
            if (obj[keys[i]] && type.toLowerCase() == "sr") {
              return true;
            }
          }
          return false;
        },
        hasDD: function(obj) {
          if (!obj) {
            return false;
          }
          var keys = Object.keys(obj)
          for (var i = 0; i < keys.length; i++) {
            var type = keys[i].substring(0, 2)
            if (obj[keys[i]] && type.toLowerCase() == "dd") {
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
            if (obj[keys[i]] && masterEvents.indexOf(keys[i]) < 0) {
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
            if (obj[keys[i]] && speedEvents.indexOf(keys[i]) >= 0) {
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
            if (obj[keys[i]] && speedEvents.indexOf(keys[i]) < 0) {
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
              if (keys[i].substring(0, 2) == type && obj[keys[i]]) {
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
        }
      }
    })

  .factory("Num",
    function() {
      return function(num) {
        return new Array(num);
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
