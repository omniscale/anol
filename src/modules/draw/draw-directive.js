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
 * @requries anol.map.LayersService
 *
 * @param {ol.style.Style} style Default style
 * @param {anol.layer.Layer} drawLayer Target layer to draw in. Must be a feature layer.
 * @param {string} pointTooltipPlacement Position of point tooltip
 * @param {string} lineTooltipPlacement Position of line tooltip
 * @param {string} polygonTooltipPlacement Position of polygon tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Provides controls to draw points, lines and polygons
 */
.directive('anolDraw', ['$compile', '$rootScope', '$translate', 'ControlsService', 'LayersService', 'MapService',
    function($compile, $rootScope, $translate, ControlsService, LayersService, MapService) {
    return {
        restrict: 'A',
        require: ['?^anolFeaturePropertiesEditor', '?^anolFeatureStyleEditor'],
        scope: {
            style: '=?',
            // TODO what happens when draw layer changes?
            drawLayer: '=?',
            tooltipDelay: '@',
            tooltipEnable: '@',
            pointTooltipPlacement: '@',
            lineTooltipPlacement: '@',
            polygonTooltipPlacement: '@',

        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/draw/templates/draw.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs, controllers) {
            var AnolFeaturePropertiesEditor = controllers[0];
            var AnolFeatureStyleEditor = controllers[1];

            // attribute defaults
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

            var drawPointControl, drawLineControl, drawPolygonControl, modifyControl;

            if(angular.isUndefined(scope.drawLayer)) {
                scope.drawLayer = new anol.layer.Feature({
                    name: 'draw_layer'
                });
                if(angular.isDefined(scope.style)) {
                    scope.drawLayer.olLayer.setStyle(scope.style);
                }

                // TODO take a look at when layerswitcher can handle
                // add layer
                $rootScope.$on('$translateChangeSuccess', function () {
                    $translate('anol.draw.LAYER_TITLE').then(function(title) {
                        scope.drawLayer.title = title;
                    });
                });
                LayersService.addLayer(scope.drawLayer);
            }

            scope.drawSource = scope.drawLayer.olLayer.getSource();

            var createDrawInteraction = function(drawType) {
                // create draw interaction
                var draw = new ol.interaction.Draw({
                    source: scope.drawSource,
                    type: drawType
                });

                // TODO how to use both?
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

                return draw;
            };

            var createDrawControl = function(controlElement, controlTarget, interaction) {
                var drawControl = new anol.control.Control({
                    element: controlElement,
                    target: controlTarget,
                    interactions: [interaction],
                    exclusive: true
                });
                drawControl.onDeactivate(deactivate, scope);
                drawControl.onActivate(activate, scope);
                return drawControl;
            };

            var createModifyControl = function(controlElement, controlTarget) {
                var selectedFeature;
                var selectInteraction = new ol.interaction.Select({
                    toggleCondition: ol.events.condition.never,
                    layers: [scope.drawLayer.olLayer]
                });
                selectInteraction.on('select', function(evt) {
                    if(evt.selected.length === 0) {
                        selectedFeature = undefined;
                    } else {
                        selectedFeature = evt.selected[0];
                    }
                });
                var modifyInteraction = new ol.interaction.Modify({
                    features: selectInteraction.getFeatures()
                });
                var _modifyControl = new anol.control.Control({
                    element: controlElement,
                    target: controlTarget,
                    interactions: [selectInteraction, modifyInteraction],
                    exclusive: true
                });
                _modifyControl.onDeactivate(deactivate, scope);
                _modifyControl.onActivate(activate, scope);
                _modifyControl.onDeactivate(function() {
                    selectedFeature = undefined;
                });

                scope.remove = function() {
                    if(selectedFeature !== undefined) {
                        scope.drawSource.removeFeature(selectedFeature);
                        selectInteraction.getFeatures().clear();
                        selectedFeature = undefined;
                    }
                };
                return _modifyControl;
            };

            var deactivate = function(targetControl, context) {
                angular.forEach(targetControl.interactions, function(interaction) {
                    context.map.removeInteraction(interaction);
                });
            };

            var activate = function(targetControl, context) {
                angular.forEach(targetControl.interactions, function(interaction) {
                    context.map.addInteraction(interaction);
                });
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

            scope.modify = function() {
                if(modifyControl.active) {
                    modifyControl.deactivate();
                } else {
                    modifyControl.activate();
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

            // modify control contains also delete
            modifyControl = createModifyControl(
                element.find('.anol-draw-modify'),
                element
            );

            ControlsService.addControls([
                drawControl, drawPointControl, drawLineControl,
                drawPolygonControl, modifyControl
            ]);
        }
    };
}]);
