import { defaults } from './module.js';
import Rotate from 'ol/control/Rotate';
import { TOUCH as hasTouch } from 'ol/has';

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
            tooltipEnable: '@',
            ngStyle: '='
        },
        link: function(scope, element, attrs) {
            var olControl = new Rotate();
            var control = new anol.control.Control({
                olControl: olControl
            });
            var controlElement = angular.element(olControl.element);
            controlElement.attr('ng-style', 'ngStyle');
            var rotateButton = controlElement.find('.ol-rotate-reset');
            rotateButton.removeAttr('title');
            rotateButton.attr('uib-tooltip', '{{\'anol.rotate.TOOLTIP\' | translate }}');
            rotateButton.attr('tooltip-placement', scope.zoomInTooltipPlacement || 'right');
            rotateButton.attr('tooltip-append-to-body', true);
            rotateButton.attr('tooltip-popup-delay', scope.tooltipDelay || 500);
            rotateButton.attr('tooltip-enable', scope.tooltipEnable === undefined ? !hasTouch : scope.tooltipEnable);
            rotateButton.attr('tooltip-trigger', 'mouseenter');

            $compile(controlElement)(scope);

            ControlsService.addControl(control);
        }
    };
}]);
