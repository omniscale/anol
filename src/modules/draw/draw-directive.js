angular.module('anol.draw')
/**
 * @ngdoc directive
 * @name anol.draw.anolDraw
 *
 * @requires $compile
 * @requires anol.map.MapService
 * @requires anol.map.ControlsSerivce
 * @requries anol.map.LayersService
 *
 * @param {ol.style.Style} style Default style
 * @param {anol.layer.Layer} drawLayer Target layer to draw in. Must be a feature layer.
 * @param {string} pointTooltipText Text for point tooltip
 * @param {string} lineTooltipText Text for line tooltip
 * @param {string} polygonTooltipText Text for polygon tooltip
 * @param {string} pointTooltipPlacement Position of point tooltip
 * @param {string} lineTooltipPlacement Position of line tooltip
 * @param {string} polygonTooltipPlacement Position of polygon tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Provides controls to draw points, lines and polygons
 */
.directive('anolDraw', ['$compile', 'ControlsService', 'LayersService', 'MapService',
    function($compile, ControlsService, LayersService, MapService) {
    return {
        restrict: 'A',
        require: ['?^anolFeaturePropertiesEditor', '?^anolFeatureStyleEditor'],
        scope: {
            style: '=',
            drawLayer: '=',
            tooltipDelay: '@',
            pointTooltipText: '@',
            pointTooltipPlacement: '@',
            lineTooltipText: '@',
            lineTooltipPlacement: '@',
            polygonTooltipText: '@',
            polygonTooltipPlacement: '@',

        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/draw/templates/draw.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        compile: function(tElement, tAttrs) {
            var prepareAttr = function(attr, _default) {
                return attr || _default;
            };

            tAttrs.tooltipDelay = prepareAttr(tAttrs.tooltipDelay, 500);
            tAttrs.pointTooltipText = prepareAttr(tAttrs.pointTooltipText, 'Draw point');
            tAttrs.pointTooltipPlacement = prepareAttr(tAttrs.pointTooltipPlacement, 'right');
            tAttrs.lineTooltipText = prepareAttr(tAttrs.lineTooltipText, 'Draw line');
            tAttrs.lineTooltipPlacement = prepareAttr(tAttrs.lineTooltipPlacement, 'right');
            tAttrs.polygonTooltipText = prepareAttr(tAttrs.polygonTooltipText, 'Draw polygon');
            tAttrs.polygonTooltipPlacement = prepareAttr(tAttrs.polygonTooltipPlacement, 'right');

            return function(scope, element, attrs, controllers) {
                var AnolFeaturePropertiesEditor = controllers[0];
                var AnolFeatureStyleEditor = controllers[1];

                var drawPointControl, drawLineControl, drawPolygonControl;

                if(angular.isUndefined(scope.drawLayer)) {
                    scope.drawLayer = new anol.layer.Feature({
                        name: 'draw_layer',
                        title: 'Draw Layer'
                    });
                    if(angular.isDefined(scope.style)) {
                        scope.drawLayer.olLayer.setStyle(scope.style);
                    }
                    LayersService.addLayer(scope.drawLayer);
                }

                scope.drawSource = scope.drawLayer.olLayer.getSource();

                var createDrawInteraction = function(drawType) {
                    // create draw interaction
                    var draw = new ol.interaction.Draw({
                        source: scope.drawSource,
                        type: drawType
                    });

                    if(angular.isDefined(AnolFeaturePropertiesEditor)) {
                        draw.on('drawend', function(evt) {
                            var feature = evt.feature;
                            AnolFeaturePropertiesEditor.editFeature(feature);
                        });
                    } else if (angular.isDefined(AnolFeatureStyleEditor)) {
                        draw.on('drawend', function(evt) {
                            var feature = evt.feature;
                            AnolFeatureStyleEditor.editFeature(feature);
                        });
                    }

                    return draw;
                };

                var createDrawControl = function(controlElement, controlTarget, interaction) {
                    var drawControl = new anol.control.Control({
                        element: controlElement,
                        target: controlTarget,
                        interaction: interaction,
                        exclusive: true
                    });
                    drawControl.onDeactivate(deactivate, scope);
                    drawControl.onActivate(activate, scope);
                    return drawControl;
                };

                var deactivate = function(targetControl, context) {
                    context.map.removeInteraction(targetControl.interaction);
                };

                var activate = function(targetControl, context) {
                    context.map.addInteraction(targetControl.interaction);
                };

                scope.drawPoint = function() {
                    if(drawPointControl.active) {
                        drawPointControl.deactivate();
                    } else {
                        drawPointControl.activate();
                    }
                };

                scope.drawLine = function() {
                    if(drawLineControl.active) {
                        drawLineControl.deactivate();
                    } else {
                        drawLineControl.activate();
                    }
                };

                scope.drawPolygon = function() {
                    if(drawPolygonControl.active) {
                        drawPolygonControl.deactivate();
                    } else {
                        drawPolygonControl.activate();
                    }
                };

                scope.map = MapService.getMap();

                element.addClass('ol-control');
                element.addClass('anol-draw');

                var drawControl = new anol.control.Control({
                    element: element
                });

                drawPointControl = createDrawControl(
                    element.find('.anol-draw-point'),
                    element,
                    createDrawInteraction('Point')
                );

                drawLineControl = createDrawControl(
                    element.find('.anol-draw-line'),
                    element,
                    createDrawInteraction('LineString')
                );

                drawPolygonControl = createDrawControl(
                    element.find('.anol-draw-polygon'),
                    element,
                    createDrawInteraction('Polygon')
                );

                ControlsService.addControls([drawControl, drawPointControl, drawLineControl, drawPolygonControl]);
            };
        }
    };
}]);
