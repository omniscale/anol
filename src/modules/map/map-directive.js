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
                // when twoFingePinchDrag is true and we have a touch device
                // set touchAction to it's default value.
                // This may cause page zoom on IE >= 10 browsers but allows us
                // to scroll the page when only one finger has touched and dragged the map
                if(ol.has.TOUCH && MapService.twoFingersPinchDrag) {
                    var viewport = scope.map.getViewport();
                    viewport.style.touchAction = 'auto';
                    viewport.style.msTouchAction = 'auto';
                }
            },
            post: function(scope, element, attrs) {
                $timeout(function() {
                    scope.map.updateSize();
                    // add layers after map has correct size to prevent
                    // loading layer twice (before and after resize)
                    LayersService.registerMap(scope.map);
                    ControlsService.registerMap(scope.map);

                    // add interactions from InteractionsService to map
                    angular.forEach(InteractionsService.interactions, function(interaction) {
                        if(ol.has.TOUCH && MapService.twoFingersPinchDrag) {
                            // when twoFingerPinchDrag is true, no PinchRotate interaction
                            // is added. This should improve map handling for users in twoFingerPinchDrag-mode
                            if(interaction instanceof ol.interaction.PinchRotate) {
                                interaction.setActive(false);
                                return;
                            }
                            // Skipped because a DragPan interaction is added later
                            if(interaction instanceof ol.interaction.DragPan) {
                                interaction.setActive(false);
                                return;
                            }
                            // reanable when needed
                            // if(interaction instanceof ol.interaction.PinchZoom) {
                            //     interaction.setActive(false);
                            //     return;
                            // }
                        }
                        scope.map.addInteraction(interaction);
                    });

                    InteractionsService.registerMap(scope.map);

                    if(ol.has.TOUCH && MapService.twoFingersPinchDrag === true) {
                        var useKeyControl, dragPan;
                        var pointers = 0;

                        var viewport = angular.element(scope.map.getViewport());

                        var createOverlayControl = function() {
                            var element = document.createElement('div');
                            element.className = 'map-info-overlay';
                            element.innerHTML = '<div class="map-info-overlay-text">' + MapService.twoFingersPinchDragText + '</div>';
                            var control = new ol.control.Control({
                                element: element
                            });
                            return control;
                        };

                        var handleTouchMove = function(e) {
                            if(useKeyControl === undefined) {
                                useKeyControl = createOverlayControl();
                                scope.map.addControl(useKeyControl);
                            }
                        };

                        var handleTouchStart = function(e) {
                            pointers++;
                            if(pointers > 1) {
                                if(dragPan === undefined) {
                                    dragPan = new ol.interaction.DragPan();
                                    scope.map.addInteraction(dragPan);
                                }
                                viewport.off('touchmove', handleTouchMove);
                                if(useKeyControl !== undefined) {
                                    scope.map.removeControl(useKeyControl);
                                    useKeyControl = undefined;
                                }
                                e.preventDefault();
                            } else {
                                viewport.one('touchmove', handleTouchMove);
                            }
                            if(pointers < 2) {
                                e.stopPropagation();
                            }
                        };

                        var handleTouchEnd = function(e) {
                            pointers--;
                            if(pointers <= 1) {
                                if(dragPan !== undefined) {
                                    dragPan.setActive(false);
                                    scope.map.removeInteraction(dragPan);
                                    dragPan = undefined;
                                }
                                e.preventDefault();
                                if(useKeyControl !== undefined) {
                                    scope.map.removeControl(useKeyControl);
                                    useKeyControl = undefined;
                                }
                            }
                            if(pointers === 0) {
                                dragPan = new ol.interaction.DragPan();
                                scope.map.addInteraction(dragPan);
                            }
                        };

                        dragPan = new ol.interaction.DragPan();
                        scope.map.addInteraction(dragPan);

                        viewport.on('touchstart', handleTouchStart);
                        viewport.on('touchend', handleTouchEnd);
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
