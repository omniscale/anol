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
        require: '?^anolMap',
        scope: {
            style: '=',
            drawSource: '='
        },
        link: function(scope, element, attrs) {
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

            var deactivate = function(targetControl, context) {
                context.map.removeInteraction(targetControl.interaction);
            };

            var activate = function(targetControl, context) {
                context.map.addInteraction(targetControl.interaction);
            };

            scope.map = MapService.getMap();

            LayersService.addLayer(new anol.layer.Layer(layerOptions));

            var drawPointInteraction = createDrawInteraction('Point');
            var drawLineInteraction = createDrawInteraction('LineString');
            var drawPolygonInteraction = createDrawInteraction('Polygon');

            element.addClass('ol-control');
            element.addClass('anol-draw');

            // create button
            var drawPointButton = angular.element('<button ng-click="drawPoint()"></button>');
            drawPointButton.addClass('anol-draw-point');
            drawPointControl = createDrawControl($compile(drawPointButton)(scope), element, drawPointInteraction);

            // create button
            var drawLineButton = angular.element('<button ng-click="drawLine()"></button>');
            drawLineButton.addClass('anol-draw-line');
            drawLineControl = createDrawControl($compile(drawLineButton)(scope), element, drawLineInteraction);

            // create button
            var drawPolygonButton = angular.element('<button ng-click="drawPolygon()"></button>');
            drawPolygonButton.addClass('anol-draw-polygon');

            drawPolygonControl = createDrawControl($compile(drawPolygonButton)(scope), element, drawPolygonInteraction);

            var drawControl = new anol.control.Control({
                element: element
            });

            ControlsService.addControls([drawControl, drawPointControl, drawLineControl, drawPolygonControl]);
        }
    };
}]);
