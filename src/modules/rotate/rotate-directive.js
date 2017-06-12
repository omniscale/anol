angular.module('anol.rotation')
/**
 * @ngdoc directive
 * @name anol.rotate.directive:anolRotation
 *
 * @requires $compile
 * @requires anol.map.ControlsService
 *
 * @param {string} tooltipPlacement Tooltip position
  * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip. Default 500ms
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 *
 * @description
 * Provides zoom buttons
 */
.directive('anolRotation', ['$compile', 'ControlsService',
    function($compile, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            tooltipPlacement: '@',
            tooltipDelay: '@',
            tooltipEnable: '@'
        },
        link: function(scope, element, attrs) {
            var olControl = new ol.control.Rotate();
            var control = new anol.control.Control({
                olControl: olControl
            });
            var rotateButton = angular.element(olControl.element).find('.ol-rotate-reset');
            rotateButton.removeAttr('title');
            rotateButton.attr('tooltip', '{{\'anol.rotate.TOOLTIP\' | translate }}');
            rotateButton.attr('tooltip-placement', scope.zoomInTooltipPlacement || 'right');
            rotateButton.attr('tooltip-append-to-body', true);
            rotateButton.attr('tooltip-popup-delay', scope.tooltipDelay || 500);
            rotateButton.attr('tooltip-enable', scope.tooltipEnable === undefined ? !ol.has.TOUCH : scope.tooltipEnable);
            rotateButton.attr('tooltip-trigger', 'mouseenter click');
            $compile(rotateButton)(scope);

            ControlsService.addControl(control);
        }
    };
}]);
