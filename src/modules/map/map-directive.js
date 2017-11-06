angular.module('anol.map')

/**
 * @ngdoc directive
 * @name anol.map.directive:anolMap
 *
 * @requires $timeout
 * @requires anol.DefaultMapName
 * @requires anol.map.MapService
 *
 * @description
 * The anol-map directive adds the map defined in MapService to the dom.
 *
 * It also add the DefaultMapName as id and class to the map element.
 */
.directive('anolMap', ['$timeout', 'DefaultMapName', 'MapService', 'LayersService', 'ControlsService', 'InteractionsService',
    function($timeout, DefaultMapName, MapService, LayersService, ControlsService, InteractionsService) {
    return {
        scope: {},
        link: {
            pre: function(scope, element, attrs) {
                scope.mapName = DefaultMapName;
                scope.map = MapService.getMap();
                element
                    .attr('id', scope.mapName)
                    .addClass(scope.mapName);

                scope.map.setTarget(document.getElementById(scope.mapName));
            },
            post: function(scope, element, attrs) {
                var pointers = 0;
                var addDragPanInteractionTimeout;
                $timeout(function() {
                    scope.map.updateSize();
                    // add layers after map has correct size to prevent
                    // loading layer twice (before and after resize)
                    angular.forEach(LayersService.backgroundLayers, function(layer) {
                        scope.map.addLayer(layer.olLayer);
                    });
                    angular.forEach(LayersService.overlayLayers, function(layer) {
                        if(layer instanceof anol.layer.Group) {
                            angular.forEach(layer.layers.slice().reverse(), function(grouppedLayer) {
                                if(LayersService.olLayers.indexOf(grouppedLayer.olLayer) < 0) {
                                    scope.map.addLayer(grouppedLayer.olLayer);
                                    LayersService.olLayers.push(grouppedLayer.olLayer);
                                }
                            });
                        } else {
                            if(LayersService.olLayers.indexOf(layer.olLayer) < 0) {
                                scope.map.addLayer(layer.olLayer);
                                LayersService.olLayers.push(layer.olLayer);
                            }
                        }
                    });
                    angular.forEach(LayersService.systemLayers, function(layer) {
                        scope.map.addLayer(layer.olLayer);
                    });
                    LayersService.registerMap(scope.map);
                    // add registered controls and interactions
                    angular.forEach(ControlsService.olControls, function(control) {
                        scope.map.addControl(control);
                    });
                    ControlsService.registerMap(scope.map);
                    angular.forEach(InteractionsService.interactions, function(interaction) {
                        scope.map.addInteraction(interaction);
                        // interaction.dispatchEvent('anol:setmap');
                    });
                    InteractionsService.registerMap(scope.map);

                    var dragPan;
                    if(MapService.twoFingersPinchDrag === true) {
                        scope.map.on('pointerdown', function() {
                            pointers++;
                            if(pointers > 1 && dragPan === undefined) {
                                dragPan = new ol.interaction.DragPan();
                                scope.map.addInteraction(dragPan);

                                // disable pinch rotate
                                scope.map.getInteractions().forEach(function(i) {
                                    if(i instanceof ol.interaction.PinchRotate) {
                                        i.setActive(false);
                                    }
                                });
                            }
                        });
                        scope.map.on('pointerup', function() {
                            pointers--;
                            if(pointers <= 1 && dragPan !== undefined) {
                                dragPan.setActive(false);
                                scope.map.removeInteraction(dragPan);
                                dragPan = undefined;

                                // reanable pinch rotate
                                scope.map.getInteractions().forEach(function(i) {
                                    if(i instanceof ol.interaction.PinchRotate) {
                                        i.setActive(true);
                                    }
                                });
                                scope.map.renderSync();
                            }
                        });
                        scope.map.on('pointermove', function() {
                            if(pointers === 1) {
                                var element = document.createElement('div');
                                element.className = 'mouse-wheel-zoom-press-key';
                                element.innerHTML = '<div class="press-key-text">Use two fingers to drag map</div>';
                                var control = new ol.control.Control({
                                    element: element
                                });
                                setTimeout(function() {
                                    if(pointers === 1) {
                                        scope.map.addControl(control);
                                        setTimeout(function() {
                                            scope.map.removeControl(control);
                                        }, 1000);
                                        addDragPanInteractionTimeout = undefined;
                                    }
                                }, 250);
                            }
                        });
                    }
                });
            }
        },
        controller: function($scope, $element, $attrs) {
            this.getMap = function() {
                return $scope.map;
            };
        }
    };
}]);
