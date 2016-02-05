angular.module('anol.draw')
/**
 * @ngdoc directive
 * @name anol.draw.anolDraw
 *
 * @requires $compile
 * @requires $rootScope
 * @requires $translate
 * @requires anol.map.MapService
 * @requires anol.map.ControlsSerivce
 * @requries anol.map.DrawService
 *
 * @param {boolean} continueDrawing Don't deactivate drawing after feature is added
 * @param {function} postDrawAction Action to call after feature is drawn. Draw control will be deactivated when postDrawAction defined.
 * @param {boolean} freeDrawing Deactivate snapped drawing
 * @param {string} pointTooltipPlacement Position of point tooltip
 * @param {string} lineTooltipPlacement Position of line tooltip
 * @param {string} polygonTooltipPlacement Position of polygon tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Provides controls to draw points, lines and polygons, modify and remove them
 */
.directive('anolDraw', ['$compile', '$rootScope', '$translate', '$timeout', 'ControlsService', 'MapService', 'DrawService',
    function($compile, $rootScope, $translate, $timeout, ControlsService, MapService, DrawService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        scope: {
            continueDrawing: '@',
            postDrawAction: '&',
            freeDrawing: '@',
            tooltipDelay: '@',
            tooltipEnable: '@',
            pointTooltipPlacement: '@',
            lineTooltipPlacement: '@',
            polygonTooltipPlacement: '@'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/draw/templates/draw.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs, AnolMapController) {
            // attribute defaults
            scope.continueDrawing = angular.isDefined(scope.continueDrawing) ?
                scope.continueDrawing : false;
            scope.freeDrawing = angular.isDefined(scope.freeDrawing) ?
                scope.freeDrawing : false;
            scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                scope.tooltipEnable : !ol.has.TOUCH;
            scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                scope.tooltipDelay : 500;
            scope.pointTooltipPlacement = angular.isDefined(scope.pointTooltipPlacement) ?
                scope.pointTooltipPlacement : 'right';
            scope.lineTooltipPlacement = angular.isDefined(scope.lineTooltipPlacement) ?
                scope.lineTooltipPlacement : 'right';
            scope.polygonTooltipPlacement = angular.isDefined(scope.polygonTooltipPlacement) ?
                scope.polygonTooltipPlacement : 'right';

            scope.activeLayer = undefined;
            var changeCursorEventKey;
            var selectedFeature;
            var controls = [];
            var drawPointControl, drawLineControl, drawPolygonControl, modifyControl;

            // disabled by default. Will be enabled, when feature selected
            var removeButtonElement = element.find('.draw-remove');
            removeButtonElement.addClass('disabled');

            var bindCursorChange = function() {
                changeCursorEventKey = scope.map.on('pointermove', changeCursor);
            };
            var unbindCursorChange = function() {
                if(changeCursorEventKey !== undefined) {
                    scope.map.unByKey(changeCursorEventKey);
                    changeCursorEventKey = undefined;
                }
            };
            var executePostDrawCallback = function(evt) {
                scope.postDrawAction()(scope.activeLayer, evt.feature);
            };

            var createDrawInteractions = function(drawType, source, control, layer) {
                // create draw interaction
                var draw = new ol.interaction.Draw({
                    source: source,
                    type: drawType
                });

                if(angular.isFunction(scope.postDrawAction) && angular.isFunction(scope.postDrawAction())) {
                    draw.on('drawend', executePostDrawCallback);
                }

                if(scope.continueDrawing === false && control !== undefined) {
                    draw.on('drawend', function() {
                        // TODO remove when https://github.com/openlayers/ol3/issues/3610/ resolved
                        $timeout(function() { control.deactivate(); }, 275);
                    });
                }
                draw.on('drawstart', unbindCursorChange);
                draw.on('drawend', bindCursorChange);

                var interactions = [draw];
                if(scope.freeDrawing !== false) {
                    var snapInteraction = new ol.interaction.Snap({
                        source: layer.getSource()
                    });
                    interactions.push(snapInteraction);
                }
                return interactions;
            };

            var createModifyInteractions = function(layer) {
                var selectInteraction = new ol.interaction.Select({
                    toggleCondition: ol.events.condition.never,
                    layers: [layer]
                });
                selectInteraction.on('select', function(evt) {
                    if(evt.selected.length === 0) {
                        selectedFeature = undefined;
                        removeButtonElement.addClass('disabled');
                    } else {
                        selectedFeature = evt.selected[0];
                        removeButtonElement.removeClass('disabled');
                    }
                });
                var modifyInteraction = new ol.interaction.Modify({
                    features: selectInteraction.getFeatures()
                });
                modifyInteraction.on('modifystart', function() {
                    if(changeCursorEventKey !== undefined) {
                        scope.map.unByKey(changeCursorEventKey);
                    }
                });
                modifyInteraction.on('modifyend', function() {
                    changeCursorEventKey = scope.map.on('pointermove', changeCursor);
                });
                var snapInteraction = new ol.interaction.Snap({
                    source: layer.getSource()
                });
                return [selectInteraction, modifyInteraction, snapInteraction];
            };

            var createDrawControl = function(controlElement, controlTarget) {
                var controlOptions = {
                    element: controlElement,
                    target: controlTarget,
                    exclusive: true,
                    disabled: true
                };
                if(AnolMapController === null) {
                    controlOptions.olControl = null;
                }
                var drawControl = new anol.control.Control(controlOptions);
                drawControl.onDeactivate(deactivate, scope);
                drawControl.onActivate(activate, scope);
                return drawControl;
            };

            var createModifyControl = function(controlElement, controlTarget) {
                var controlOptions = {
                    element: controlElement,
                    target: controlTarget,
                    exclusive: true,
                    disabled: true
                };
                if(AnolMapController === null) {
                    controlOptions.olControl = null;
                }
                var _modifyControl = new anol.control.Control(controlOptions);
                _modifyControl.onDeactivate(deactivate);
                _modifyControl.onActivate(activate);
                _modifyControl.onDeactivate(function() {
                    selectedFeature = undefined;
                });
                return _modifyControl;
            };

            var deactivate = function(targetControl) {
                angular.forEach(targetControl.interactions, function(interaction) {
                    interaction.setActive(false);
                });
            };

            var activate = function(targetControl) {
                angular.forEach(targetControl.interactions, function(interaction) {
                    interaction.setActive(true);
                });
            };

            var changeCursor = function(evt) {
                var pixel = scope.map.getEventPixel(evt.originalEvent);

                var hit = scope.map.hasFeatureAtPixel(pixel, function(layer) {
                    return layer === scope.activeLayer.olLayer;
                });

                scope.map.getTarget().style.cursor = hit ? 'pointer' : '';
            };

            // Button binds
            scope.drawPoint = function() {
                if(drawPointControl.disabled === true) {
                    return;
                }
                if(drawPointControl.active) {
                    drawPointControl.deactivate();
                } else {
                    drawPointControl.activate();
                }
            };

            scope.drawLine = function() {
                if(drawLineControl.disabled === true) {
                    return;
                }
                if(drawLineControl.active) {
                    drawLineControl.deactivate();
                } else {
                    drawLineControl.activate();
                }
            };

            scope.drawPolygon = function() {
                if(drawPolygonControl.disabled === true) {
                    return;
                }
                if(drawPolygonControl.active) {
                    drawPolygonControl.deactivate();
                } else {
                    drawPolygonControl.activate();
                }
            };

            scope.modify = function() {
                if(modifyControl.disabled === true) {
                    return;
                }
                if(modifyControl.active) {
                    modifyControl.deactivate();
                } else {
                    modifyControl.activate();
                }
            };

            scope.remove = function() {
                if(selectedFeature !== undefined) {
                    scope.activeLayer.olLayer.getSource().removeFeature(selectedFeature);
                    modifyControl.interactions[0].getFeatures().clear();
                    selectedFeature = undefined;
                }
            };

            scope.map = MapService.getMap();

            element.addClass('anol-draw');

            if(AnolMapController !== null) {
                element.addClass('ol-control');
                var drawControl = new anol.control.Control({
                    element: element
                });
                controls.push(drawControl);
            }

            drawPointControl = createDrawControl(
                element.find('.draw-point'),
                element
            );
            controls.push(drawPointControl);

            drawLineControl = createDrawControl(
                element.find('.draw-line'),
                element
            );
            controls.push(drawLineControl);

            drawPolygonControl = createDrawControl(
                element.find('.draw-polygon'),
                element
            );
            controls.push(drawPolygonControl);

            modifyControl = createModifyControl(
                element.find('.draw-modify'),
                element
            );
            modifyControl.onActivate(function() {
                changeCursorEventKey = scope.map.on('pointermove', changeCursor);
            });
            modifyControl.onDeactivate(function(control) {
                control.interactions[0].getFeatures().clear();
                removeButtonElement.addClass('disabled');
                if(changeCursorEventKey !== undefined) {
                    scope.map.unByKey(changeCursorEventKey);
                }
            });
            controls.push(modifyControl);

            ControlsService.addControls(controls);

            var allInteractions = function() {
                return drawPointControl.interactions
                    .concat(drawLineControl.interactions)
                    .concat(drawPolygonControl.interactions)
                    .concat(modifyControl.interactions);
            };

            var visibleDewatcher;

            var bindActiveLayer = function(layer) {
                drawPointControl.interactions = createDrawInteractions(
                    'Point', layer.olLayer.getSource(), drawPointControl, layer.olLayer);
                drawPointControl.enable();
                drawLineControl.interactions = createDrawInteractions(
                    'LineString', layer.olLayer.getSource(), drawLineControl, layer.olLayer);
                drawLineControl.enable();
                drawPolygonControl.interactions = createDrawInteractions(
                    'Polygon', layer.olLayer.getSource(), drawPolygonControl, layer.olLayer);
                drawPolygonControl.enable();
                modifyControl.interactions = createModifyInteractions(layer.olLayer);
                modifyControl.enable();

                angular.forEach(allInteractions(), function(interaction) {
                    interaction.setActive(false);
                    scope.map.addInteraction(interaction);
                });

                scope.activeLayer = layer;

                visibleDewatcher = scope.$watch(function() {
                    return scope.activeLayer.getVisible();
                }, function(n) {
                    if(n === false) {
                        DrawService.changeLayer(undefined);
                    }
                });
            };

            var unbindActiveLayer = function() {
                angular.forEach(allInteractions(), function(interaction) {
                    interaction.setActive(false);
                    scope.map.removeInteraction(interaction);
                });

                drawPointControl.disable();
                drawPointControl.interactions = [];
                drawLineControl.disable();
                drawLineControl.interactions = [];
                drawPolygonControl.disable();
                drawPolygonControl.interactions = [];
                modifyControl.disable();
                modifyControl.interactions = [];

                if(visibleDewatcher !== undefined) {
                    visibleDewatcher();
                }

                scope.activeLayer = undefined;
            };

            scope.$watch(function() {
                return DrawService.activeLayer;
            }, function(newActiveLayer, oldActiveLayer) {
                if(newActiveLayer === scope.activeLayer) {
                    return;
                }
                if(oldActiveLayer !== undefined) {
                    unbindActiveLayer();
                }
                if(newActiveLayer !== undefined) {
                    bindActiveLayer(newActiveLayer);
                }
            });
        }
    };
}]);
