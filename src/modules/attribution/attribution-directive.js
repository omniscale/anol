angular.module('anol.attribution')
/**
 * @ngdoc directive
 * @name anol.attribution.directive:anolAttribution
 *
 * @requires $compile
 * @requires anol.map.ControlsService
 *
 * @param {string} attributionTooltipPlacement Tooltip position for attribution in button
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip. Default 500ms
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 *
 * @description
 * Provides attribution buttons
 */
.directive('anolAttribution', ['$compile', 'ControlsService',
    function($compile, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            zoomOutTooltipText: '@',
            zoomOutTooltipPlacement: '@',
            tooltipDelay: '@',
            tooltipEnable: '@'
        },
        link: function(scope, element, attrs) {
            var olControl = new ol.control.Attribution({
                label: document.createTextNode(''),
                collapseLabel: document.createTextNode('')
            });
            var control = new anol.control.Control({
                olControl: olControl
            });

            var tooltipEnable = angular.isDefined(scope.tooltipEnable) ? scope.tooltipEnable : (!ol.has.TOUCH);

            var attributionButton = angular.element(olControl.element).find('button');
            attributionButton.removeAttr('title');
            attributionButton.attr('tooltip', '{{\'anol.attribution.TOOLTIP\' | translate }}');
            attributionButton.attr('tooltip-placement', scope.zoomInTooltipPlacement || 'left');
            attributionButton.attr('tooltip-append-to-body', true);
            attributionButton.attr('tooltip-popup-delay', scope.tooltipDelay || 500);
            attributionButton.attr('tooltip-enable', tooltipEnable);
            $compile(attributionButton)(scope);

            ControlsService.addControl(control);
        }
    };
}]);
