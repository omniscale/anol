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
            if(layer.attribution === undefined || layer.attribution === null) {
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
.directive('anolAttribution', ['ControlsService', 'LayersService',
    function(ControlsService, LayersService) {
    return {
        restrict: 'A',
        scope: {
            attributionVisible: '@anolAttribution',
            tooltipPlacement: '@',
            tooltipDelay: '@',
            tooltipEnable: '@'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/attribution/templates/attribution.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs) {
            // attribute defaults
            scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
                scope.tooltipPlacement : 'left';
            scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                scope.tooltipDelay : 500;
            scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                scope.tooltipEnable : !ol.has.TOUCH;
            scope.layers = LayersService.flattedLayers();

            ControlsService.addControl(
                new anol.control.Control({
                    element: element
                })
            );
        }
    };
}]);
