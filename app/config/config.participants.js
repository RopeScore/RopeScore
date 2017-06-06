'use strict';
/**
 * @class ropescore.config.participants
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.config.participants', ['ngRoute'])
  
  .config([
    '$routeProvider',
    function($routeProvider) {
      $routeProvider.when('/config/participants/:id', {
        templateUrl: '/config/config.participants.html',
        controller: 'ParticipantsCtrl'
      });
    }
  ])
  
  /**
   * @class ropescore.config.participants.ParticipantsCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} $routeParams
   * @param {service} Db
   */
  .controller('ParticipantsCtrl', function($scope, $location, $routeParams, Db,
                                           Num) {
    $scope.data = Db.get()
    
    $scope.id = $routeParams.id;
    $scope.setID($scope.id)
    
    $scope.data[$scope.id].config.idStart = $scope.data[$scope.id].config.idStart ||
      100;
    
    $scope.getNumber = Num
    
    $scope.addNum = 25;
    $scope.add = function() {
      var max = 0;
      if($scope.data[$scope.id].participants) {
        var ids = Object.keys($scope.data[$scope.id].participants)
        ids = ids.sort(function(a, b) {return b - a});
        var max = Number(ids[0]) + 1;
      } else {
        max = $scope.data[$scope.id].config.idStart;
      }
      if(!$scope.data[$scope.id].participants) {
        $scope.data[$scope.id].participants = {};
      }
      for(var i = 0; i < $scope.addNum; i++) {
        $scope.data[$scope.id].participants[max + i] = {};
      }
    };
    
    $scope.import = function() {
      var data = Papa.parse($scope.csv, {
        delimiter: '\t'
      })
      var processed = [];
      
      var ids = Object.keys($scope.data[$scope.id].participants)
      ids = ids.sort(function(a, b) {return b - a});
      var max = Number(ids[0]) + 1;
      
      var indexes = {
        name: data.data[0].findIndex(function(el) { return el.toLowerCase() == 'name'}),
        club: data.data[0].findIndex(function(el) { return el.toLowerCase() == 'club'})
      };
      if((indexes.name < 0 || indexes.club < 0) || (indexes.name < 0 && indexes.club < 0)) {
        // incomplete or no header, first row ignored
        data.data.shift();
        indexes = {
          name: 0,
          club: 1
        }
      }
      for(var i = 0; i < data.data.length; i++) {
        $scope.data[$scope.id].participants[max + i] = {
          name: data.data[i][indexes.name],
          club: data.data[i][indexes.club]
        }
      }
    }
    
    $scope.delete = function(uid) {
      $scope.$apply(delete $scope.data[$scope.id].participants[uid])
    }
    
    $scope.save = function() {
      Db.set($scope.data)
      $location.path('/event/' + $scope.id)
    }
  })
