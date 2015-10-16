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
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 *
 * @description
 * Adds a overview map
 */
.directive('anolOverviewMap', ['$compile', 'ControlsService', 'LayersService', 'MapService', function($compile, ControlsService, LayersService) {
    return {
        restrict: 'A',
        scope: {
            tooltipPlacement: '@',
            tooltipDelay: '@'
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
            overviewmapButton.attr('tooltip', '{{ \'anol.overviewmap.TOOLTIP\' | translate }}');
            overviewmapButton.attr('tooltip-placement', scope.tooltipPlacement || 'right');
            overviewmapButton.attr('tooltip-append-to-body', true);
            overviewmapButton.attr('tooltip-popup-delay', scope.tooltipDelay || 500);
            overviewmapButton.attr('tooltip-enable', scope.tooltipEnable === undefined ? !ol.has.TOUCH : scope.tooltipEnable);

            $compile(overviewmapButton)(scope);
            ControlsService.addControl(control);
        }
    };
}]);
