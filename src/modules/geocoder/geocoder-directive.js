angular.module('anol.geocoder')
/**
 * @ngdoc directive
 * @name anol.geocoder.directive:anolGeocoderSearchbox
 *
 * @restrict A
 * @required $timeout
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 *
 * @param {string} anolGeocoderSearchbox Name of geocoder to use. Must be an available anol.geocoder
 * @param {string} zoomLevel Level to show result in
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
        geocoder: '@anolGeocoderSearchbox',
        zoomLevel: '@'
      },
      link: function(scope, element, attrs, AnolMapController) {
        var geocoder = new anol.geocoder[scope.geocoder]();

        scope.searchResults = [];

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
            geocoder.request(scope.searchString)
              .then(function(results) {
                scope.$apply(function() {
                  scope.searchResults = results;
                  element.find('.anol-searchbox').addClass('open');
                });
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
              result.projectionCode,
              view.getProjection()
            )
          );
          if(angular.isDefined(scope.zoomLevel)) {
            view.setZoom(parseInt(scope.zoomLevel));
          }
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