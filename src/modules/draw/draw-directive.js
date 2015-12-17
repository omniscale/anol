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
.directive('anolDraw', ['$compile', '$rootScope', '$translate', 'ControlsService', 'MapService', 'DrawService',
    function($compile, $rootScope, $translate, ControlsService, MapService, DrawService) {
    return {
        restrict: 'A',
        require: ['?^anolFeaturePropertiesEditor', '?^anolFeatureStyleEditor'],
        scope: {
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

            var activeLayer;
            var selectedFeature;
            var drawPointControl, drawLineControl, drawPolygonControl, modifyControl;

            var createDrawInteractions = function(drawType, source) {
                // create draw interaction
                var draw = new ol.interaction.Draw({
                    source: source,
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
                return [draw];
            };

            var createModifyInteractions = function(layer) {
                var selectInteraction = new ol.interaction.Select({
                    toggleCondition: ol.events.condition.never,
                    layers: [layer]
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
                return [selectInteraction, modifyInteraction];
            };

            var createDrawControl = function(controlElement, controlTarget) {
                var drawControl = new anol.control.Control({
                    element: controlElement,
                    target: controlTarget,
                    exclusive: true
                });
                drawControl.onDeactivate(deactivate, scope);
                drawControl.onActivate(activate, scope);
                return drawControl;
            };

            var createModifyControl = function(controlElement, controlTarget) {
                var _modifyControl = new anol.control.Control({
                    element: controlElement,
                    target: controlTarget,
                    exclusive: true
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

            // Button binds
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

            scope.remove = function() {
                if(selectedFeature !== undefined) {
                    activeLayer.olLayer.getSource().removeFeature(selectedFeature);
                    modifyControl.interactions[0].getFeatures().clear();
                    selectedFeature = undefined;
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
                element
            );

            drawLineControl = createDrawControl(
                element.find('.anol-draw-line'),
                element
            );

            drawPolygonControl = createDrawControl(
                element.find('.anol-draw-polygon'),
                element
            );

            modifyControl = createModifyControl(
                element.find('.anol-draw-modify'),
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
                drawPointControl.interactions = createDrawInteractions('Point', layer.olLayer.getSource());
                drawLineControl.interactions = createDrawInteractions('LineString', layer.olLayer.getSource());
                drawPolygonControl.interactions = createDrawInteractions('Polygon', layer.olLayer.getSource());
                modifyControl.interactions = createModifyInteractions(layer.olLayer);

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
                drawLineControl.interactions = [];
                drawPolygonControl.interactions = [];
                modifyControl.interactions = [];

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
