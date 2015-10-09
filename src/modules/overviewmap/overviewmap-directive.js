angular.module('anol.overviewmap')
/**
 * @ngdoc directive
 * @name anol.overviewmap.directive:anolOverviewMap
 *
 * @requires $compile
 * @requires anol.map.ControlsSerivce
 * @requries anol.map.LayersService
 * @requries anol.map.MapService
 *
 * @param {string} tooltipText Text for tooltip
 * @param {string} tooltipPlacement Position of tooltip
 *
 * @description
 * Adds a overview map
 */
.directive('anolOverviewMap', ['$compile', 'ControlsService', 'LayersService', 'MapService', function($compile, ControlsService, LayersService) {
    return {
        restrict: 'A',
        scope: {
            tooltipText: '@',
            tooltipPlacement: '@'
        },
        link: function(scope, element, attrs) {
            var backgroundLayers = [];
            angular.forEach(LayersService.backgroundLayers, function(layer) {
                backgroundLayers.push(layer.olLayer);
            });
            var olControl = new ol.control.OverviewMap({
                layers: backgroundLayers,
                label: document.createTextNode(''),
                collapseLabel: document.createTextNode('')
            });
            var control = new anol.control.Control({
                olControl: olControl
            });
            // disable nativ tooltip
            var overviewmapButton = angular.element(olControl.element).find('button');
            overviewmapButton.removeAttr('title');
            // add cool tooltip
            overviewmapButton.attr('tooltip', scope.tooltipText || 'Overview Map');
            overviewmapButton.attr('tooltip-placement', scope.tooltipPlacement || 'right');
            overviewmapButton.attr('tooltip-append-to-body', true);

            $compile(overviewmapButton)(scope);
            ControlsService.addControl(control);
        }
    };
}]);
