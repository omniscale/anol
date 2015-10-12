angular.module('anol.featurepopup')
/**
 * @ngdoc directive
 * @name anol.featurepopup.directive:anolFeaturePopup
 *
 * @restrict A
 * @requires $timeout
 * @requires anol.map.MapService
 * @requires anol.map.LayersService
 * @requires anol.map.ControlsService
 *
 * @param {Float} extentWidth Width of square bounding box around clicked point
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Shows feature properties for layers with 'featureinfo' property.
 *
 * Layer property **featureinfo** - {Object} - Contains properties:
 * - **properties** {Array<String>} - Property names to display
 */
.directive('anolFeaturePopup', ['$timeout', 'MapService', 'LayersService', 'ControlsService', function($timeout, MapService, LayersService, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            'extentWidth': '='
        },
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurepopup/templates/popup.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: {
            pre: function(scope, element, attrs) {
                scope.map = MapService.getMap();
                scope.propertiesCollection = [];
                scope.popupVisible = false;
                scope.overlayOptions = {
                    element: element[0],
                    autoPan: true,
                    autoPanAnimation: {
                        duration: 250
                    }

                };

                var calculateExtent = function(center) {
                    var resolution = scope.map.getView().getResolution();
                    var width = resolution * scope.extentWidth;
                    return [center[0] - width, center[1] - width, center[0] + width, center[1] + width];
                };

                var extractProperties = function(features, displayProperties) {
                    var propertiesCollection = [];
                    angular.forEach(features, function(feature) {
                        var properties = {};
                        angular.forEach(feature.getProperties(), function(value, key) {

                            if($.inArray(key, displayProperties) > -1) {
                                properties[key] = value;
                            }
                        });
                        if(!angular.equals(properties, {})) {
                            propertiesCollection.push(properties);
                        }
                    });
                    return propertiesCollection;
                };

                var propertiesByExtent = function(evt) {
                    var extent = calculateExtent(evt.coordinate);
                    var propertiesCollection = [];
                    angular.forEach(LayersService.layers, function(layer) {
                        var anolLayers = [layer];
                        if(layer instanceof anol.layer.Group) {
                            anolLayers = layer.layers;
                        }
                        angular.forEach(anolLayers, function(anolLayer) {
                            if(!anolLayer.olLayer instanceof ol.layer.Vector) {
                                return;
                            }
                            if(!anolLayer.featureinfo) {
                                return;
                            }
                            propertiesCollection = propertiesCollection.concat(
                                extractProperties(
                                    anolLayer.olLayer.getSource().getFeaturesInExtent(extent),
                                    anolLayer.featureinfo.properties
                                )
                            );
                        });
                    });
                    return propertiesCollection;
                };

                var propertiesAtPixel = function(evt) {
                    var propertiesCollection = [];
                    scope.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                        if(!layer instanceof ol.layer.Vector) {
                            return;
                        }
                        if(!layer.get('anolLayer') || !layer.get('anolLayer').featureinfo) {
                            return;
                        }
                        propertiesCollection = propertiesCollection.concat(
                            extractProperties(
                                [feature],
                                layer.get('anolLayer').featureinfo.properties
                            )
                        );
                    });
                    return propertiesCollection;
                };
                var getProperties = angular.isDefined(scope.extentWidth) ? propertiesByExtent : propertiesAtPixel;

                scope.handleClick = function(evt) {
                    var visible = false;
                    var propertiesCollection = getProperties(evt);

                    if(propertiesCollection.length > 0) {
                        visible = true;
                    }

                    scope.$apply(function() {
                        scope.propertiesCollection = propertiesCollection;
                        scope.popupVisible = visible;
                    });
                    if(visible) {
                        $timeout(function() {
                            scope.popup.setPosition(evt.coordinate);
                        });
                    }
                };
            },
            post: function(scope, element, attrs) {
                var handlerKey;

                scope.popup = new ol.Overlay(scope.overlayOptions);
                scope.map.addOverlay(scope.popup);

                scope.close = function() {
                    scope.popupVisible = false;
                };

                var control = new anol.control.Control({
                    subordinate: true,
                    olControl: null
                });
                control.onDeactivate(function() {
                    scope.map.unByKey(handlerKey);
                });
                control.onActivate(function() {
                    handlerKey = scope.map.on('singleclick', scope.handleClick, this);
                });

                control.activate();

                ControlsService.addControl(control);
            }
        }
    };
}]);
