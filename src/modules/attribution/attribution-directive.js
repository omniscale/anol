import './module.js';
import { TOUCH as hasTouch } from 'ol/has';

angular.module('anol.attribution')

/**
 * @ngdoc filter
 * @name anol.attribution.filter:uniqueActiveAttribution
 *
 * @description
 * Reduce given layers to visible once with, removes layers with duplicated attribution
 */
    .filter('uniqueActiveAttribution', function() {
        return function(layers) {
            var founds = {};
            var newLayers = [];
            angular.forEach(layers, function(layer) {
                if(!layer.getVisible()) {
                    return;
                }
                if(angular.isUndefined(layer.attribution) || layer.attribution === null) {
                    return;
                }
                if(founds[layer.attribution] === true) {
                    return;
                }
                founds[layer.attribution] = true;
                newLayers.push(layer);
            });
            return newLayers;
        };
    })
/**
 * @ngdoc directive
 * @name anol.attribution.directive:anolAttribution
 *
 * @requires $compile
 * @requires anol.map.ControlsService
 *
 * @param {boolean} anolAttribution Start with open attributions. Default false.
 * @param {string} attributionTooltipPlacement Tooltip position for attribution in button
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip. Default 500ms
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Provides attribution buttons
 */
    .directive('anolAttribution', ['$templateRequest', '$compile', 'ControlsService', 'LayersService',
        function($templateRequest, $compile, ControlsService, LayersService) {
            return {
                restrict: 'A',
                scope: {
                    attributionVisible: '@anolAttribution',
                    tooltipPlacement: '@',
                    tooltipDelay: '@',
                    tooltipEnable: '@'
                },
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/attribution.html');
                },
                link: function(scope, element, attrs) {
                    if (attrs.templateUrl && attrs.templateUrl !== '') {
                        $templateRequest(attrs.templateUrl).then(function(html){
                            var template = angular.element(html);
                            element.html(template);
                            $compile(template)(scope);
                        });
                    } 
                    // attribute defaults
                    scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
                        scope.tooltipPlacement : 'left';
                    scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                        scope.tooltipDelay : 500;
                    scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                        scope.tooltipEnable : !hasTouch;
                    scope.layers = LayersService.flattedLayers();

                    ControlsService.addControl(
                        new anol.control.Control({
                            element: element
                        })
                    );
                }
            };
        }]);
