angular.module('anol.draw')

/**
 * @ngdoc directive
 * @name anol.draw.anolDraw
 *
 * @requires $compile
 * @requires anol.map.MapService
 * @requires anol.map.ControlsSerivce
 * @requries anol.map.LayersService
 * @requires anol.map.InteractionsService
 *
 * @param {ol.style.Style} style Default style
 *
 * @description
 * Line drawment
 */
.directive('anolDraw', ['$compile', 'ControlsService', 'LayersService', 'MapService',
    function($compile, ControlsService, LayersService, MapService) {
    return {
        restrict: 'A',
        require: '?^anolFeaturePropertiesEditor',
        scope: {
            style: '=',
            drawSource: '='
        },
        templateUrl: 'src/modules/draw/templates/draw.html',
        link: function(scope, element, attrs, AnolFeaturePropertiesEditor) {
            var drawPointControl, drawLineControl, drawPolygonControl;

            if(angular.isUndefined(scope.drawSource)) {
                scope.drawSource = new ol.source.Vector();
            }

            var _drawLayer = new ol.layer.Vector({
                source: scope.drawSource
            });

            if(angular.isDefined(scope.style)) {
                _drawLayer.setStyle(scope.style);
            }

            var layerOptions = {
                title: 'Draw Layer',
                name: 'drawLayer',
                olLayer: _drawLayer
            };

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

            LayersService.addLayer(new anol.layer.Layer(layerOptions));

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
        }
    };
}]);
