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
 * @namespace jumpscore
 * @requires ngRoute
 */
angular.module('jumpscore', [
  'ngRoute',
  'jumpscore.dash',
  'jumpscore.config',
  'jumpscore.config.participants',
  'jumpscore.event',
  'jumpscore.score',
  'jumpscore.results'
])

  .config([
    '$locationProvider', '$routeProvider', '$compileProvider',
    function($locationProvider, $routeProvider, $compileProvider) {
      /**
       * @description ngRoute with html5 mode (no hashbang, but with fallback)
       * @memberOf jumpscore.jumpscore
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
     * @memberOf trick
     * @description function to go to /
     */
    $rootScope.goHome = function() {
      $location.path('/');
    };

    $rootScope.setID = function(id) {
      $rootScope.id = id;
    }

    /* still dreaming about autoupdate...
      store.watch('jumpscore', function() {
      console.log(store.get('jumpscore'))
      $rootScope.data = store.get('jumpscore')
    })*/
  })

  .factory("Db",
    /**
     * @function Db
     * @memberOf jumpscore.jumpscore
     * @return {object} Return database
     */
    function() {

      return {
        get: function() {
          return store.get('jumpscore') || {}
        },
        set: function(newData) {
          return store.set('jumpscore', newData)
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

        srp: "Single Rope Triple Unders"
      }
      var speedEvents = ['srss', 'srse', 'srsr', 'ddsr', 'srp', 'srd']

      return {
        unabbr: function(abbr) {
          return abbrs[abbr]
        },
        isSpeed: function(abbr) {
          return (speedEvents.indexOf(abbr) >= 0 ? true : false);
        },
        count: function(obj, type) {
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
