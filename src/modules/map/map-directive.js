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

                var createOverlayControl = function() {
                    var element = document.createElement('div');
                    element.className = 'map-info-overlay';
                    element.innerHTML = '<div class="map-info-overlay-text">' + MapService.twoFingersPinchDragText + '</div>';
                    var control = new ol.control.Control({
                        element: element
                    });
                    return control;
                };

                $timeout(function() {
                    scope.map.updateSize();
                    // add layers after map has correct size to prevent
                    // loading layer twice (before and after resize)
                    LayersService.registerMap(scope.map);
                    ControlsService.registerMap(scope.map);

                    // when twoFingerPinchDrag is true, no PinchRotate and -Zoom interaction
                    // is added. This should improve map handling for users in twoFingerPinchDrag-mode
                    angular.forEach(InteractionsService.interactions, function(interaction) {
                        if(ol.has.TOUCH && MapService.twoFingersPinchDrag) {
                            if(interaction instanceof ol.interaction.PinchRotate) {
                                interaction.setActive(false);
                                return;
                            }
                            if(interaction instanceof ol.interaction.PinchZoom) {
                                interaction.setActive(false);
                                return;
                            }
                        }
                        scope.map.addInteraction(interaction);
                    });
                    InteractionsService.registerMap(scope.map);

                    var dragPan;
                    var useKeyControl;
                    var unregisterDragPanEvent;

                    if(ol.has.TOUCH && MapService.twoFingersPinchDrag === true) {
                        scope.map.on('pointerdown', function() {
                            pointers++;
                            if(pointers > 1 && dragPan === undefined) {
                                dragPan = new ol.interaction.DragPan();
                                scope.map.addInteraction(dragPan);
                            }
                            return true;
                        });
                        scope.map.on('pointerup', function() {
                            pointers--;
                            if(pointers <= 1 && dragPan !== undefined && unregisterDragPanEvent === undefined) {
                                unregisterDragPanEvent = scope.map.once('moveend', function() {
                                    dragPan.setActive(false);
                                    scope.map.removeInteraction(dragPan);
                                    dragPan = undefined;
                                    unregisterDragPanEvent = undefined;
                                });
                            }
                            return true;
                        });
                        scope.map.on('pointermove', function() {
                            if(pointers !== 1) {
                                return true;
                            }
                            if(useKeyControl !== undefined) {
                                return true;
                            }

                            useKeyControl = createOverlayControl();
                            setTimeout(function() {
                                // ensure move is going on
                                if(pointers === 1) {
                                    scope.map.addControl(useKeyControl);
                                    setTimeout(function() {
                                        scope.map.removeControl(useKeyControl);
                                        useKeyControl = undefined;
                                    }, 1000);
                                } else {
                                    useKeyControl = undefined;
                                }
                            }, 100);

                            return true;
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
