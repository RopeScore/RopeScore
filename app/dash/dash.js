/* global angular, FileReader, confirm, pad, nameCleaner */
'use strict'
/**
 * @class ropescore.dash
 * @memberOf ropescore
 * @requires ngRoute
 */
angular.module('ropescore.dash', ['ngRoute'])

  .config([
    '$routeProvider',
    function ($routeProvider) {
      $routeProvider.when('/', {
        templateUrl: '/dash/dash.html',
        controller: 'DashCtrl'
      })
    }
  ])

  /**
   * @class ropescore.dash.DashCtrl
   * @param {service} $scope
   * @param {service} $location
   * @param {service} Db
   */
  .controller('DashCtrl', function ($scope, $route, $location, Checksum, Db, Config) {
    $scope.data = Db.get()

    /** unset the category id */
    $scope.setID(null)

    let date = new Date()
    $scope.today = pad(date.getFullYear(), 4) + '' + pad(date.getMonth() + 1, 2) + '' + pad(date.getDate(), 2)

    /**
     * make a link for a file to save the data as json
     * @type {String}
     */
    $scope.linkData = 'data:application/json;base64,' + window.btoa(unescape(encodeURIComponent(JSON.stringify($scope.data))))

    /**
     * resets the system by deleting all data
     * @return {undefined}
     */
    $scope.reset = function () {
      $scope.data = {}
      $route.reload()
      Db.set($scope.data)
    }

    /**
     * saves the data
     * @return {undefined}
     */
    $scope.save = function () {
      Db.set($scope.data)
    }

    $scope.checksum = Checksum
    $scope.nameCleaner = nameCleaner

    /**
     * sort an array of categories with the order ungrouped, ...new(alphabetically), ...old(by reference)
     * @param  {Object[]} arr      array of groups
     * @param  {String}   arr.name name of group
     * @param  {String[]} ref      reference array with groupnames in order
     * @return {Object[]}          arr, but sorted
     */
    function sortArr (arr, ref) {
      let sorted = []

      let ungroupedIndex = arr.findIndex(obj => obj.name.toLowerCase() === 'ungrouped')
      if (ungroupedIndex > -1) {
        sorted.push(arr[ungroupedIndex])
        arr.splice(ungroupedIndex, 1)
      }

      let newcommers = arr.filter(obj => ref.findIndex(str => obj.name.toLowerCase() === str.toLowerCase()) < 0).sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      sorted = sorted.concat(newcommers)

      let oldsorted = ref.map(str => arr[arr.findIndex(obj => obj.name.toLowerCase() === str.toLowerCase())]).filter(objorundef => typeof objorundef !== 'undefined')
      sorted = sorted.concat(oldsorted)

      return sorted
    }

    /**
     * takes an array of group object and returns an array of group names
     * @param  {Object[]} arr      array of groups
     * @param  {String}   arr.name name of group
     * @return {String[]}          array of group names
     */
    function saver (arr) {
      return arr.map(obj => obj.name)
    }

    /**
     * Move one group object +/- one index in an array
     * @param  {Object[]} arr      array of groups
     * @param  {String}   arr.name name of group
     * @param  {String}   str      name of group to move
     * @param  {Boolean}  dec      set to true if the group's index should decrease
     * @return {Object[]}          arr, but one obj moved +/- one index
     */
    function move (arr, str, dec) {
      let oldIndex = arr.findIndex(obj => obj.name.toLowerCase() === str.toLowerCase())
      if (oldIndex < 0) return arr

      let newIndex = oldIndex + (dec ? -1 : 1)
      if (newIndex < 0) newIndex = 0
      if (newIndex > arr.length) newIndex = arr.length

      let clone = arr.slice()
      clone.splice(oldIndex, 1)
      clone.splice(newIndex, 0, arr[oldIndex])

      return clone
    }

    /**
     * make a new array with every category's id from the data object, to use in
     * ng-repeat with ngSort
     * @return {String[]}
     */
    $scope.getEventsArray = function () {
      if (typeof $scope.data !== 'undefined' || (typeof $scope.data === 'object' && Object.keys($scope.data).length > 0)) {
        var groups = []
        let ref = []
        var cats = Object.keys($scope.data)
        cats = cats.filter(function (str) {
          return str !== 'globconfig'
        })
        for (let str of cats) {
          if (groups.findIndex(function (obj) { return obj.name.toLowerCase() === ($scope.data[str].config.group || 'Ungrouped').toLowerCase() }) < 0) groups.push({name: $scope.data[str].config.group || 'Ungrouped', categories: []})
          let index = groups.findIndex(function (obj) { return obj.name.toLowerCase() === ($scope.data[str].config.group || 'Ungrouped').toLowerCase() })
          groups[index].categories.push(str)
        }
        for (let i = 0; i < groups.length; i++) {
          groups[i].categories.sort((a, b) => $scope.data[a].config.name.toLowerCase().localeCompare($scope.data[b].config.name.toLowerCase()))
        }

        /* sort groups */
        if (typeof $scope.data.globconfig !== 'undefined' && typeof $scope.data.globconfig.sortCache !== 'undefined') {
          ref = $scope.data.globconfig.sortCache
        }
        groups = sortArr(groups, ref)
        console.log(groups, ref)
        if (typeof $scope.data.globconfig === 'undefined') $scope.data.globconfig = {}
        $scope.data.globconfig.sortCache = saver(groups)
        $scope.save()

        return groups
      } else {
        return []
      }
    }
    $scope.eventsArray = $scope.getEventsArray()

    $scope.move = function (str, dec) {
      $scope.eventsArray = move($scope.eventsArray, str, dec)
      if (typeof $scope.data.globconfig === 'undefined') $scope.data.globconfig = {}
      $scope.data.globconfig.sortCache = saver($scope.eventsArray)
      $scope.save()
    }

    /**
     * takes an array of category id's and returns true if it has at least one completed category and at least one uncompleted
     * @param  {String[]} arr Array of id's
     * @return {Boolean}
     */
    $scope.hasCompletedAndUncompleted = function (arr) {
      return arr.findIndex(function (str) {
        return $scope.data[str].config.completed
      }) > -1 && arr.findIndex(function (str) {
        return !$scope.data[str].config.completed
      }) > -1
    }

    /**
     * reset the ordering
     * @return {undefined}
     */
    $scope.resetOrder = function () {
      $scope.data.globconfig.sortCache = []
      $scope.eventsArray = $scope.getEventsArray()
      $scope.save()
    }

    console.log(Config)

    document.getElementById('import-file')
      .addEventListener('change', function (evt) {
        console.log('File detected, attempting parse')
        var files = evt.target.files
        var file = files[0]
        var reader = new FileReader()
        reader.onload = function () {
          var data = JSON.parse(this.result)
          if (confirm('This will overwrite ALL your existing data.\nRopeScore Live API details and the computers name will be reset.')) {
            Db.set(data)
            $scope.$apply(function () {
              $scope.data = data
              $scope.eventsArray = $scope.getEventsArray()
            })
          }
        }
        reader.readAsText(file)
      }, false)
  })
