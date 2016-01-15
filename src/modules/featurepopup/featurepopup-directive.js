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
 *
 * @description
 * Shows a popup for selected feature
 */
.directive('anolFeaturePopup', ['$timeout', 'MapService', 'LayersService', 'ControlsService', function($timeout, MapService, LayersService, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            'layers': '=',
            'tolerance': '=',
            'multiselect': '@'
        },
        replace: true,
        transclude: true,
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurepopup/templates/popup.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs) {
            // TODO find solution for multiple directives in one page
            var multiselect = angular.isDefined(scope.multiselect);
            scope.map = MapService.getMap();
            scope.popupVisible = false;

            scope.feature = undefined;
            scope.layer = undefined;
            scope.selectes = {};

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
                }

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
                scope.popupVisible = false;
                scope.$digest();
                var _handleSelect = multiselect === true ? handleMultiSelect : handleSingleSelect;

                if(_handleSelect(evt) === true) {
                    scope.popupVisible = true;
                    scope.$digest();
                    // wait until scope changes applied ($digest cycle completed) before set popup position
                    // otherwise Overlay.autoPan is not work correctly
                    $timeout(function() {
                        // popup could have been closed by $scope.close()
                        if(scope.popupVisible === true) {
                            scope.popup.setPosition(evt.mapBrowserEvent.coordinate);
                        }
                    });
                }
            };

            var recreateInteractions = function() {
                scope.popupVisible = false;

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
                    layers: olLayers,
                    style: function(feature) {
                        // prevents changing feature style
                        // TODO find better solution
                        var style = feature.getStyle() || selectInteraction.getLayer(feature).getStyle();
                        if(angular.isFunction(style)) {
                            return style(feature);
                        }
                        return style;
                    }
                });
                selectInteraction.on('select', handleSelect);

                interactions = [selectInteraction].concat(snapInteractions);
                angular.forEach(interactions, function(interaction) {
                    scope.map.addInteraction(interaction);
                });
            };

            var changeCursor = function(evt) {
                var pixel = scope.map.getEventPixel(evt.originalEvent);

                var hit = scope.map.hasFeatureAtPixel(pixel, function(layer) {
                    return scope.layers.indexOf(layer.get('anolLayer')) !== -1;
                });

                scope.map.getTarget().style.cursor = hit ? 'pointer' : '';
            };
            var changeCursorEvtKey;

            var bindCursorChange = function() {
                if((scope.layers === undefined || scope.layers.length === 0) && changeCursorEvtKey !== undefined) {
                    scope.map.unByKey(changeCursorEvtKey);
                } else if(scope.layers !== undefined && scope.layers.length !== 0) {
                    changeCursorEvtKey = scope.map.on('pointermove', changeCursor);
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
                scope.map.unByKey(changeCursorEvtKey);
                scope.map.getTarget().style.cursor = '';
            });
            control.onActivate(function() {
                angular.forEach(interactions, function(interaction) {
                    interaction.setActive(true);
                });
                changeCursorEvtKey = scope.map.on('pointermove', changeCursor);
            });

            recreateInteractions();

            control.activate();

            ControlsService.addControl(control);

            scope.$watch('layers', recreateInteractions);
            scope.$watch('layers', bindCursorChange);
            scope.$watch('popupVisible', function(visible) {
                if(!visible) {
                    selectInteraction.getFeatures().clear();
                    scope.layer = undefined;
                    scope.feature = undefined;
                }
            });
        },
        controller: function($scope, $element, $attrs) {
            this.close = function() {
                $scope.popupVisible = false;
            };
            $scope.close = this.close;
        }
    };
}]);
