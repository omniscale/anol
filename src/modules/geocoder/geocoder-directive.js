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
.directive('anolGeocoderSearchbox', ['$http', '$timeout', 'MapService', 'ControlsService',
  function($http, $timeout, MapService, ControlsService) {
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
          element.find('.anol-searchbox').addClass('open');
        };

        scope.searchResults = [];
        scope.coordinate = scope.coordinate_.split(',');

        scope.handleInputKeypress = function(event) {
          event.stopPropagation();
          if(event.key === 'ArrowDown' && scope.searchResults.length > 0) {
            event.preventDefault();
            // use timeout to prevent input element on-blur bug. ($apply already in progress error is raised)
            $timeout(function() {
              element.find('.dropdown-menu li a:first').focus();
            }, 0);
          }
          if(event.key === 'Enter') {
            $http.get(scope.searchUrl + scope.searchString)
              .success(function(response) {
                handleResponse(response);
              });
          }
          return false;
        };

        scope.handleDropdownKeypress = function(event) {
          event.stopPropagation();
          var targetParent = angular.element(event.currentTarget).parent();
          if(event.key === 'ArrowDown') {
            event.preventDefault();
            targetParent.next().find('a').focus();
          }
          if(event.key === 'ArrowUp') {
            event.preventDefault();
            var target = targetParent.prev().find('a');
            if(target.length === 0) {
              element.find('.form-control').focus();
            } else {
              target.focus();
            }
          }
          return false;
        };

        scope.handleMouseover = function(event) {
          // use timeout to prevent input element on-blur bug. ($apply already in progress error is raised)
          $timeout(function() {
            angular.element(event.currentTarget).focus();
          }, 0);
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
          element.find('.anol-searchbox').removeClass('open');
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