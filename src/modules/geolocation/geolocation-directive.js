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
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Get current position and center map on it.
 */
.directive('anolGeolocation', ['$compile', '$translate', '$timeout', 'MapService', 'ControlsService', 'LayersService', 'InteractionsService',
  function($compile, $translate, $timeout, MapService, ControlsService, LayersService, InteractionsService) {
    return {
      scope: {
        anolGeolocation: '@',
        disableButton: '@',
        zoom: '@',
        tooltipPlacement: '@',
        tooltipDelay: '@',
        tooltipEnable: '@',
        showPosition: '@',
        highlight: '@',
        resultStyle: '=?'
      },
      templateUrl: function(tElement, tAttrs) {
          var defaultUrl = 'src/modules/geolocation/templates/geolocation.html';
          return tAttrs.templateUrl || defaultUrl;
      },
      link: function(scope, element) {
        scope.anolGeolocation = 'false' !== scope.anolGeolocation;
        scope.showPosition = 'false' !== scope.showPosition;
        scope.highlight = angular.isDefined(scope.highlight) ? parseInt(scope.highlight) : false;

        // attribute defaults
        scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
          scope.tooltipPlacement : 'right';
        scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
          scope.tooltipDelay : 500;
        scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
          scope.tooltipEnable : !ol.has.TOUCH;

        if(scope.showPosition) {
          var geolocationLayer = new anol.layer.Feature({
            name: 'geolocationLayer',
            displayInLayerswitcher: false,
            style: scope.resultStyle
          });
          var geolocationOlLayerOptions = geolocationLayer.olLayerOptions;
          geolocationOlLayerOptions.source = new geolocationLayer.OL_SOURCE_CLASS(geolocationLayer.olSourceOptions);
          geolocationLayer.setOlLayer(new geolocationLayer.OL_LAYER_CLASS(geolocationOlLayerOptions));

          LayersService.addSystemLayer(geolocationLayer);
        }

        if('true' !== scope.disableButton) {
          var button = angular.element('');
          element.addClass('anol-geolocation');
          element.append($compile(button)(scope));
        }

        var changeCursorCondition = function(pixel) {
            return MapService.getMap().hasFeatureAtPixel(pixel, function(layer) {
                return geolocationLayer === layer.get('anolLayer');
            });
        };

        var addGeolocationFeatures = function(accuracyGeometry, position) {
          var features = [];
          if(accuracyGeometry !== undefined && accuracyGeometry !== null) {
            features.push(new ol.Feature({
              geometry: accuracyGeometry
            }));
          }
          if(position !== undefined && position !== null) {
            features.push(new ol.Feature({
              geometry: new ol.geom.Point(position)
            }));
          }
          if(features.length > 0) {
            geolocationLayer.addFeatures(features);

            if(scope.highlight > 0) {
              $timeout(function() {
                geolocationLayer.clear();
              }, scope.highlight);
            } else {
              removeGeolocationFeaturesInteraction = new ol.interaction.Select({
                layers: [geolocationLayer.olLayer]
              });
              removeGeolocationFeaturesInteraction.on('select', function(evt) {
                if(evt.selected.length > 0) {
                  removeGeolocationFeaturesInteraction.getFeatures().clear();
                  geolocationLayer.clear();
                  InteractionsService.removeInteraction(removeGeolocationFeaturesInteraction);
                  MapService.removeCursorPointerCondition(changeCursorCondition);
                  removeGeolocationFeaturesInteraction = undefined;
                }
              });
              InteractionsService.addInteraction(removeGeolocationFeaturesInteraction);
              MapService.addCursorPointerCondition(changeCursorCondition);
            }
          }
        };

        var view = MapService.getMap().getView();
        var geolocation = new ol.Geolocation({
          projection: view.getProjection(),
          tracking: scope.anolGeolocation,
          trackingOptions: {
            enableHighAccuracy: true,
            maximumAge: 0
          }
        });

        geolocation.on('change:accuracyGeometry', function() {
          geolocation.setTracking(false);
          var position = geolocation.getPosition();
          var accuracyGeometry = geolocation.getAccuracyGeometry();
          var constrainedPosition = view.constrainCenter(position);
          if(position[0] !== constrainedPosition[0] || position[1] !== constrainedPosition[1]) {
            $translate('anol.geolocation.POSITION_OUT_OF_MAX_EXTENT').then(function(translation) {
              scope.$emit('anol.geolocation', {'message': translation, 'type': 'error'});
            });
            return;
          }
          if(scope.showPosition) {
            addGeolocationFeatures(accuracyGeometry, position);
          }
          view.setCenter(position);
          view.fit(accuracyGeometry.getExtent(), MapService.getMap().getSize());
          if(angular.isDefined(scope.zoom) && parseInt(scope.zoom) < view.getZoom()) {
            view.setZoom(parseInt(scope.zoom));
          }
        });

        scope.locate = function() {
          if(scope.showPosition) {
            geolocationLayer.clear();
          }
          geolocation.setTracking(true);
        };

        element.addClass('ol-control');

        ControlsService.addControl(new anol.control.Control({
          element: element
        }));
      }
    };
}]);
