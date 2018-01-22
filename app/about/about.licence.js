/* global angular, Config */
'use strict'
/**
 * @class ropescore.about.licence
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.about.licence', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      if (Config.Eval) {
        $routeProvider.when('/licence', {
          templateUrl: '/about/about.licence.eval.html',
          controller: 'LicenceCtrl'
        })
      } else {
        $routeProvider.when('/licence', {
          templateUrl: '/about/about.licence' + (Config.Country !== 'intl' ? '.' + Config.Country : '') + '.html',
          controller: 'LicenceCtrl'
        })
      }
    }
  ])

  /**
   * @class ropescore.about.licence.LicenceCtrl
   */
  .controller('LicenceCtrl', function ($scope, Config) {
    $scope.licence = Config.licence

    /**
     * list of FOSS projects used in RopeScore, for proper credits
     * @type {Object}
     */
    $scope.foss = {
      MIT: [
        {
          name: 'Angular.js',
          licence: 'https://github.com/angular/angular.js/blob/master/LICENSE'
        },
        {
          name: 'Store.js',
          licence: 'https://github.com/marcuswestin/store.js/blob/master/LICENSE'
        },
        {
          name: 'Papa Parse',
          licence: 'https://github.com/mholt/PapaParse/blob/master/LICENSE'
        },
        {
          name: 'console.history (modified)',
          licence: 'https://github.com/lesander/console.history/blob/master/LICENSE'
        },
        {
          name: 'js-sha1 (modified)',
          licence: 'https://github.com/emn178/js-sha1/blob/master/LICENSE.txt'
        },
        {
          name: 'lsbridge',
          licence: 'https://github.com/krasimir/lsbridge/blob/master/LICENSE'
        },
        // Node Modules
        {
          name: 'electron',
          licence: 'https://github.com/electron/electron/blob/master/LICENSE'
        },
        {
          name: 'electron installer',
          licence: 'https://github.com/electron/windows-installer/blob/master/LICENCE.md'
        },
        {
          name: 'yargs',
          licence: 'https://github.com/yargs/yargs/blob/master/LICENSE'
        },
        {
          name: 'express.js',
          licence: 'https://github.com/expressjs/express/blob/master/LICENSE'
        },
        {
          name: 'fs-extra',
          licence: 'https://github.com/jprichardson/node-fs-extra/blob/master/LICENSE'
        }
      ],
      Apache: [
        {
          name: 'js-xlsx (modified)',
          licence: 'https://github.com/xSirrioNx/js-xlsx'
        },
        // Node Modules
        {
          name: 'electron-squirrel-startup',
          licence: 'https://github.com/mongodb-js/electron-squirrel-startup/blob/master/LICENSE'
        }
      ],
      'BSD 2-Clause': [
        // Node Modules
        {
          name: 'express-ws',
          licence: 'https://github.com/HenningM/express-ws/blob/master/LICENSE'
        },
        {
          name: 'electron-packager',
          licence: 'https://github.com/electron-userland/electron-packager/blob/master/LICENSE'
        }
      ]
    }
  })
