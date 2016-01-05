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
        require: ['?^anolFeaturePropertiesEditor', '?^anolFeatureStyleEditor'],
        scope: {
            continueDrawing: '@',
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
        link: function(scope, element, attrs, controllers) {
            var AnolFeaturePropertiesEditor = controllers[0];
            var AnolFeatureStyleEditor = controllers[1];

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

            var activeLayer;
            var selectedFeature;
            var drawPointControl, drawLineControl, drawPolygonControl, modifyControl;

            // disabled by default. Will be enabled, when feature selected
            var removeButtonElement = element.find('.draw-remove');
            removeButtonElement.addClass('disabled');

            var createDrawInteractions = function(drawType, source, control, layer) {
                // create draw interaction
                var draw = new ol.interaction.Draw({
                    source: source,
                    type: drawType
                });

                if(scope.continueDrawing === false) {
                    draw.on('drawend', function() {
                        // TODO remove when https://github.com/openlayers/ol3/issues/3610/ resolved
                        $timeout(function() { control.deactivate(); }, 275);
                    });
                }

                // TODO how to use both?
                // TODO check if we can remove this!
                if(angular.isObject(AnolFeaturePropertiesEditor)) {
                    draw.on('drawend', function(evt) {
                        var feature = evt.feature;
                        AnolFeaturePropertiesEditor.editFeature(feature);
                    });
                } else if (angular.isObject(AnolFeatureStyleEditor)) {
                    draw.on('drawend', function(evt) {
                        var feature = evt.feature;
                        AnolFeatureStyleEditor.editFeature(feature);
                    });
                }
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
                var snapInteraction = new ol.interaction.Snap({
                    source: layer.getSource()
                });
                return [selectInteraction, modifyInteraction, snapInteraction];
            };

            var createDrawControl = function(controlElement, controlTarget) {
                var drawControl = new anol.control.Control({
                    element: controlElement,
                    target: controlTarget,
                    exclusive: true,
                    disabled: true
                });
                drawControl.onDeactivate(deactivate, scope);
                drawControl.onActivate(activate, scope);
                return drawControl;
            };

            var createModifyControl = function(controlElement, controlTarget) {
                var _modifyControl = new anol.control.Control({
                    element: controlElement,
                    target: controlTarget,
                    exclusive: true,
                    disabled: true
                });
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
                    return layer === activeLayer.olLayer;
                });

                scope.map.getTarget().style.cursor = hit ? 'pointer' : '';
            };
            var changeCursorEventKey;

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
                    modifyControl.interactions[0].getFeatures().clear();
                    modifyControl.deactivate();
                    if(changeCursorEventKey !== undefined) {
                        scope.map.unByKey(changeCursorEventKey);
                    }
                } else {
                    modifyControl.activate();
                    changeCursorEventKey = scope.map.on('pointermove', changeCursor);
                }
            };

            scope.remove = function() {
                if(selectedFeature !== undefined) {
                    activeLayer.olLayer.getSource().removeFeature(selectedFeature);
                    modifyControl.interactions[0].getFeatures().clear();
                    selectedFeature = undefined;
                    removeButtonElement.addClass('disabled');
                }
            };

            scope.map = MapService.getMap();

            element.addClass('ol-control');
            element.addClass('anol-draw');

            var drawControl = new anol.control.Control({
                element: element
            });

            drawPointControl = createDrawControl(
                element.find('.draw-point'),
                element
            );

            drawLineControl = createDrawControl(
                element.find('.draw-line'),
                element
            );

            drawPolygonControl = createDrawControl(
                element.find('.draw-polygon'),
                element
            );

            modifyControl = createModifyControl(
                element.find('.draw-modify'),
                element
            );

            ControlsService.addControls([
                drawControl, drawPointControl, drawLineControl,
                drawPolygonControl, modifyControl
            ]);

            var allInteractions = function() {
                return drawPointControl.interactions
                    .concat(drawLineControl.interactions)
                    .concat(drawPolygonControl.interactions)
                    .concat(modifyControl.interactions);
            };

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

                activeLayer = layer;
            };

            var unbindActiveLayer = function() {
                angular.forEach(allInteractions(), function(interaction) {
                    interaction.setActive(false);
                    scope.map.removeInteraction(interaction);
                });

                drawPointControl.interactions = [];
                drawPointControl.disable();
                drawLineControl.interactions = [];
                drawLineControl.disable();
                drawPolygonControl.interactions = [];
                drawPolygonControl.disable();
                modifyControl.interactions = [];
                modifyControl.disable();

                activeLayer = undefined;
            };

            scope.$watch(function() {
                return DrawService.activeLayer;
            }, function(newActiveLayer, oldActiveLayer) {
                if(newActiveLayer === activeLayer) {
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
