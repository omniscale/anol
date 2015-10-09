angular.module('anol.geolocation')
/**
 * @ngdoc directive
 * @name anol.geolocation.directive:anolGeolocation
 *
 * @restrict A
 * @requires $compile
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 *
 * @param {boolean} anolGeolocation When true, geolocation is startet just after map init
 * @param {boolean} disableButton When true, no geolocate button is added
 * @param {number} zoom Zoom level after map centered on geolocated point
 * @param {string} tooltipText Text for tooltip
 * @param {string} tooltipPlacement Position of tooltip
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Get current position and center map on it.
 */
.directive('anolGeolocation', ['$compile', 'MapService', 'ControlsService',
  function($compile, MapService, ControlsService) {
    return {
      require: '?anolMap',
      scope: {
        anolGeolocation: '@',
        disableButton: '@',
        zoom: '@',
        tooltipText: '@',
        tooltipPlacement: '@'
      },
      templateUrl: function(tElement, tAttrs) {
          var defaultUrl = 'src/modules/geolocation/templates/geolocation.html';
          return tAttrs.templateUrl || defaultUrl;
      },
      compile: function(tElement, tAttrs) {
        var prepareAttr = function(attr, _default) {
            return attr || _default;
        };
        tAttrs.tooltipText = prepareAttr(tAttrs.tooltipText, 'Start geolocation');
        tAttrs.tooltipPlacement = prepareAttr(tAttrs.tooltipPlacement, 'right');

        return function(scope, element) {
          scope.anolGeolocation = 'false' !== scope.anolGeolocation;

          if('true' !== scope.disableButton) {
            var button = angular.element('');
            element.addClass('anol-geolocation');
            element.append($compile(button)(scope));
          }

          var view = MapService.getMap().getView();
          var geolocation = new ol.Geolocation({
            projection: view.getProjection(),
            tracking: scope.anolGeolocation
          });

          geolocation.on('change:position', function() {
            geolocation.setTracking(false);
            var position = geolocation.getPosition();
            view.setCenter(position);
            if(angular.isDefined(scope.zoom)) {
              view.setZoom(parseInt(scope.zoom));
            }
          });

          scope.locate = function() {
            geolocation.setTracking(true);
          };

          element.addClass('ol-control');

          ControlsService.addControl(new anol.control.Control({
            element: element
          }));
        };
      }
    };
}]);
