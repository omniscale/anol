angular.module('anol.featurepopup')
/**
 * @ngdoc directive
 * @name anol.featurepopup.directive:anolFeaturePopup
 *
 * @restrict A
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {anol.layer.Feature} layers Layers to show popup for
 * @param {number} tolerance Click tolerance in pixel
 * @param {object} openFor Accepts an object with layer and feature property. If changed, a popup is shown for given value
 * @param {string} openingDirection Direction where the popup open. Default is top. Also the values left, bottom and right are possible
 * @param {number} autoPanMargin Popup margin to map border for auto pan
 *
 * @description
 * Shows a popup for selected feature
 */
.directive('anolFeaturePopup', ['MapService', 'LayersService', 'ControlsService', function(MapService, LayersService, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            'layers': '=?',
            'tolerance': '=?',
            'openFor': '=?',
            'openingDirection': '@',
            'onClose': '&?',
            'autoPanMargin': '='
        },
        replace: true,
        transclude: true,
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurepopup/templates/popup.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs) {
            var multiselect = angular.isDefined(attrs.multiselect);
            var clickPointSelect = angular.isDefined(attrs.clickPointSelect);
            scope.openingDirection = scope.openingDirection || 'top';
            scope.map = MapService.getMap();

            scope.feature = undefined;
            scope.layer = undefined;
            scope.selects = {};

            if(angular.isUndefined(scope.layers)) {
                scope.layers = [];
                scope.$watch(function() {
                    return LayersService.flattedLayers;
                }, function(layers) {
                    scope.layers.length = 0;
                    angular.forEach(layers, function(layer) {
                        if(!(layer instanceof anol.layer.Feature)) {
                            return;
                        }
                        scope.layers.push(layer);
                    });
                });
            }

            scope.overlayOptions = {
                element: element[0],
                autoPan: true,
                autoPanAnimation: {
                    duration: 250
                },
                autoPanMargin: scope.autoPanMargin
            };

            scope.popup = new ol.Overlay(scope.overlayOptions);
            scope.map.addOverlay(scope.popup);

            var selectInteraction;
            var interactions = [];

            var handleMultiSelect = function(evt) {
                scope.selects = {};
                if(evt.selected.length === 0) {
                    return false;
                }
                angular.forEach(evt.selected, function(feature) {
                    var layer = selectInteraction.getLayer(feature).get('anolLayer');
                    if(scope.selects[layer.name] === undefined) {
                        scope.selects[layer.name] = {
                            layer: layer,
                            features: [feature]
                        };
                    } else {
                        scope.selects[layer.name].features.push(feature);
                    }
                });
                return true;
            };
            var handleSingleSelect = function(evt) {
                scope.feature = undefined;
                scope.layer = undefined;
                if(evt.selected.length === 0) {
                    return false;
                }
                scope.feature = evt.selected[0];
                scope.layer = selectInteraction.getLayer(scope.feature).get('anolLayer');
                return true;
            };

            var handleSelect = function(evt) {
                var _handleSelect = multiselect === true ? handleMultiSelect : handleSingleSelect;

                if(_handleSelect(evt) === true) {
                    scope.coordinate = evt.mapBrowserEvent.coordinate;
                    selectInteraction.getFeatures().clear();
                } else {
                    scope.coordinate = undefined;
                }
                scope.$digest();
            };

            var handleClick = function(evt) {
                var extent = [
                    evt.coordinate[0] - (scope.tolerance || 0),
                    evt.coordinate[1] - (scope.tolerance || 0),
                    evt.coordinate[0] + (scope.tolerance || 0),
                    evt.coordinate[1] + (scope.tolerance || 0)
                ];
                scope.selects = {};
                var found = false;
                angular.forEach(scope.layers, function(layer) {
                    var _features = layer.olLayer.getSource().getFeaturesInExtent(extent);
                    if(_features.length > 0) {
                        found = true;
                        scope.selects[layer.name] = {
                            layer: layer,
                            features: _features
                        };
                    }
                });
                if(found === true) {
                    scope.coordinate = evt.coordinate;
                } else {
                    scope.coordinate = undefined;
                }
                scope.$digest();
            };

            var recreateInteractions = function() {
                angular.forEach(interactions, function(interaction) {
                    interaction.setActive(false);
                    scope.map.removeInteraction(interaction);
                });

                var olLayers = [];
                var snapInteractions = [];
                angular.forEach(scope.layers, function(layer) {
                    olLayers.push(layer.olLayer);
                    snapInteractions.push(new ol.interaction.Snap({
                        source: layer.olLayer.getSource(),
                        pixelTolerance: scope.tolerance
                    }));
                });
                selectInteraction = new ol.interaction.Select({
                    toggleCondition: ol.events.condition.never,
                    multi: multiselect,
                    layers: olLayers
                });
                selectInteraction.on('select', handleSelect);

                interactions = [selectInteraction].concat(snapInteractions);
                angular.forEach(interactions, function(interaction) {
                    scope.map.addInteraction(interaction);
                });
            };

            var changeCursorCondition = function(pixel) {
                return scope.map.hasFeatureAtPixel(pixel, function(layer) {
                    return scope.layers.indexOf(layer.get('anolLayer')) !== -1;
                });
            };

            var bindCursorChange = function() {
                if(scope.layers === undefined || scope.layers.length === 0) {
                    MapService.removeCursorPointerCondition(changeCursorCondition);
                } else if(scope.layers !== undefined && scope.layers.length !== 0) {
                    MapService.addCursorPointerCondition(changeCursorCondition);
                }
            };

            var control = new anol.control.Control({
                subordinate: true,
                olControl: null
            });
            control.onDeactivate(function() {
                angular.forEach(interactions, function(interaction) {
                    interaction.setActive(false);
                });
                MapService.removeCursorPointerCondition(changeCursorCondition);
            });
            control.onActivate(function() {
                angular.forEach(interactions, function(interaction) {
                    interaction.setActive(true);
                });
                MapService.addCursorPointerCondition(changeCursorCondition);
            });

            if(clickPointSelect === true) {
                scope.map.on('singleclick', handleClick, this);
                scope.$watch('layers', function() {
                    scope.coordinate = undefined;
                });
            } else {
                recreateInteractions();
                scope.$watch('layers', recreateInteractions);
            }

            control.activate();

            ControlsService.addControl(control);

            scope.$watch('layers', bindCursorChange);
            scope.$watch('coordinate', function(coordinate) {
                if(coordinate === undefined) {
                    if(selectInteraction !== undefined) {
                        selectInteraction.getFeatures().clear();
                    }
                    scope.layer = undefined;
                    scope.feature = undefined;
                    if(angular.isFunction(scope.onClose) && angular.isFunction(scope.onClose())) {
                        scope.onClose()();
                    }
                }
                scope.popup.setPosition(coordinate);
            });
            scope.$watch('openFor', function(openFor) {
                if(angular.isDefined(openFor)) {
                    scope.layer = openFor.layer;
                    scope.feature = openFor.feature;
                    if(openFor.coordinate !== undefined) {
                        scope.coordinate = openFor.coordinate;
                    } else if(scope.feature !== undefined) {
                        scope.coordinate = scope.feature.getGeometry().getLastCoordinate();
                    }
                    if(openFor.content !== undefined) {
                        element.find('.anol-popup-content').empty().append(openFor.content);
                    }
                    scope.openFor = undefined;
                }
            });
        },
        controller: function($scope, $element, $attrs) {
            this.close = function() {
                $scope.coordinate = undefined;
            };
            $scope.close = this.close;
        }
    };
}]);
