angular.module('anol.geocoder')
/**
 * @ngdoc directive
 * @name anol.geocoder.directive:anolGeocoderSearchbox
 *
 * @restrict A
 * @requires $http
 * @required $timeout
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 *
 * @param {string} anolGeocoderSearchbox Url to geocoder service
 * @param {string} display Result property to use for display results
 * @param {string} coordinate Result properties for lon and lat values
 *
 * @description
 * Search for a location string on given geocoder, display and select results
 */
.directive('anolGeocoderSearchbox', ['$http', 'MapService', 'ControlsService',
  function($http, MapService, ControlsService, LayersService) {
    return {
      restrict: 'A',
      require: '?^anolMap',
      transclude: true,
      templateUrl: 'src/modules/geocoder/templates/searchbox.html',
      scope: {
        searchUrl: '@anolGeocoderSearchbox',
        display: '@',
        coordinate_: '@coordinate'
      },
      link: function(scope, element, attrs, AnolMapController) {
        var handleResponse = function(response) {
          var results = [];
          angular.forEach(response, function(result) {
            results.push({
              displayText: result[scope.display],
              coordinate: [
                parseFloat(result[scope.coordinate[0]]),
                parseFloat(result[scope.coordinate[1]])
              ]
            });
          });
          scope.searchResults = results;
        };
        scope.coordinate = scope.coordinate_.split(',');
        scope.request = function(event) {
          if(event.which !== 13) {
            return;
          }
          $http.get(scope.searchUrl + scope.searchString)
            .success(function(response) {
              handleResponse(response);
            });
        };
        scope.showResult = function(result) {
          var view = MapService.getMap().getView();
          view.setCenter(
            ol.proj.transform(
              result.coordinate,
              'EPSG:4326',
              view.getProjection()
            )
          );
          scope.searchResults = [];
        };

        if(angular.isDefined(AnolMapController)) {
          element.addClass('ol-unselectable');
        }
        ControlsService.addControl(new ol.control.Control({
          element: element.first().context
        }));
      }
    };
}]);