'use strict';
/**
 * @class jumpscore.dash
 * @memberOf jumpscore
 * @requires ngRoute
 */
angular.module('jumpscore.dash', ['ngRoute'])

  .config([
    '$routeProvider',
  function($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: '/dash/dash.html',
        controller: 'DashCtrl'
      });
    }
  ])

  /**
   * @class jumpscore.dash.DashCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} Db
   */
  .controller('DashCtrl', function($scope, $location, Db) {
    $scope.data = Db.get()

    $scope.setID(null)

    $scope.linkData = 'data:application/json;base64,' +
      window.btoa(unescape(encodeURIComponent(JSON.stringify($scope.data))));

    $scope.save = function() {
      Db.set($scope.data)
    }

    document.getElementById('import-file')
      .addEventListener('change', function(evt) {
        var files = evt.target.files;
        var file = files[0];
        var reader = new FileReader();
        reader.onload = function() {
          var data = JSON.parse(this.result);
          if (confirm("This will overwrite ALL your existing data")) {
            Db.set(data);
            $scope.$apply(function() {
              $scope.data = data;
            })
          }
        }
        reader.readAsText(file)
      }, false)
  })
