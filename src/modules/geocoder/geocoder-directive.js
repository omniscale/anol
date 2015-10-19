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
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Search for a location string on given geocoder, display and select results
 */
 // TODO add text when no result found
 // TODO show user search is in progress
.directive('anolGeocoderSearchbox', ['MapService', 'ControlsService',
  function(MapService, ControlsService) {
    return {
      restrict: 'A',
      transclude: true,
      templateUrl: function(tElement, tAttrs) {
          var defaultUrl = 'src/modules/geocoder/templates/searchbox.html';
          return tAttrs.templateUrl || defaultUrl;
      },
      scope: {
        geocoder: '@anolGeocoderSearchbox',
        zoomLevel: '@',
        geocoderOptions: '='
      },
      link: function(scope, element, attrs) {
        var geocoder = new anol.geocoder[scope.geocoder](scope.geocoderOptions);
        scope.searchResults = [];

        scope.handleInputKeypress = function(event) {
          event.stopPropagation();
          if((event.key === 'ArrowDown' || event.keyCode === 40) && scope.searchResults.length > 0) {
            event.preventDefault();
            element.find('.dropdown-menu li a:first').focus();
          }
          if(event.key === 'Enter' || event.keyCode === 13) {
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
          if(event.key === 'ArrowDown' || event.keyCode === 40) {
            event.preventDefault();
            targetParent.next().find('a').focus();
          }
          if(event.key === 'ArrowUp' || event.keyCode === 38) {
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
          angular.element(event.currentTarget).focus();
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

        ControlsService.addControl(new anol.control.Control({
          element: element
        }));
      }
    };
}]);