angular.module('anol.featureproperties')
/**
 * @ngdoc directive
 * @name anol.featureproperties.directive:anolFeatureProperties
 *
 * @restrict A
 * @requires $timeout
 * @requires pascalprecht.$translate
 * @requires anol.map.MapService
 * @requires anol.map.LayersService
 * @requires anol.map.ControlsService
 *
 * @param {Float} extentWidth Width of square bounding box around clicked point
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {string} translationNamespace Namespace to use in translation table. Default "featureproperties".
 *
 * @description
 * Shows feature properties for layers with 'featureinfo' property.
 *
 * Layer property **featureinfo** - {Object} - Contains properties:
 * - **properties** {Array<String>} - Property names to display
 *
 * **Translating feature properties**
 * @example
 * ```
{
    "featureproperties": {
        "{layername}": {
            "PROPERTY_KEY": "{property key translation}",
            "property_key": {
                "property_value_1": "{property value 1 translation}",
                "property_value_2": "{property value 2 translation}"
            }
        }
    }
}```
 *
 *
 */
.directive('anolFeatureProperties', ['$timeout', '$translate', 'MapService', 'LayersService', 'ControlsService', function($timeout, $translate, MapService, LayersService, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            'extentWidth': '=',
            'translationNamespace': '@'
        },
        replace: true,
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featureproperties/templates/popup.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: {
            pre: function(scope, element, attrs) {
                scope.translationNamespace = angular.isDefined(scope.translationNamespace) ?
                    scope.translationNamespace : 'featureproperties';
                scope.map = MapService.getMap();
                scope.propertiesCollection = [];
                scope.popupVisible = false;
                scope.hasFeature = false;
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

                var extractProperties = function(features, anolLayer) {
                    var displayProperties = anolLayer.featureinfo.properties;
                    var propertiesCollection = [];
                    angular.forEach(features, function(feature) {
                        var properties = {};
                        angular.forEach(feature.getProperties(), function(value, key) {
                            if(
                                $.inArray(key, displayProperties) > -1 &&
                                angular.isString(value) &&
                                value !== ''
                            ) {
                                properties[key] = {
                                    key: key,
                                    value: value
                                };
                                var translateKey = [scope.translationNamespace, anolLayer.name, key.toUpperCase()].join('.');
                                var translateValue = [scope.translationNamespace, anolLayer.name, key, value].join('.');
                                // this get never rejected cause of array usage
                                // see https://github.com/angular-translate/angular-translate/issues/960
                                $translate([
                                    translateKey,
                                    translateValue
                                ]).then(
                                    function(translations) {
                                        var translatedKey = translations[translateKey];
                                        var translatedValue = translations[translateValue];
                                        if(translatedKey === translateKey) {
                                            translatedKey = key;
                                        }
                                        if(translatedValue === translateValue) {
                                            translatedValue = value;
                                        }
                                        properties[key] = {
                                            key: translatedKey,
                                            value: translatedValue
                                        };
                                    }
                                );
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
                            var features = anolLayer.olLayer.getSource().getFeaturesInExtent(extent);
                            scope.hasFeature = features.length > 0;
                            propertiesCollection = propertiesCollection.concat(
                                extractProperties(
                                    features,
                                    anolLayer
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
                        if(angular.isObject(feature)) {
                            scope.hasFeature = true;
                        }
                        propertiesCollection = propertiesCollection.concat(
                            extractProperties(
                                [feature],
                                layer.get('anolLayer')
                            )
                        );
                    });
                    return propertiesCollection;
                };
                var getProperties = angular.isDefined(scope.extentWidth) ? propertiesByExtent : propertiesAtPixel;

                scope.handleClick = function(evt) {
                    scope.$apply(function() {
                        scope.popupVisible = false;
                    });
                    // changed in getProperties on feature hit
                    scope.hasFeature = false;
                    var propertiesCollection = getProperties(evt);
                    if(scope.hasFeature === false || propertiesCollection.length === 0) {
                        return;
                    }
                    scope.$apply(function() {
                        scope.propertiesCollection = propertiesCollection;
                        scope.popupVisible = true;
                    });

                    // wait until scope changes applied ($digest cycle completed) before set popup position
                    // otherwise Overlay.autoPan is not work correctly
                    $timeout(function() {
                        scope.popup.setPosition(evt.coordinate);
                    });
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
