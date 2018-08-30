require('angular');

import { defaults } from './module.js';
import {defaults as defaultControls, ScaleLine} from 'ol/control.js';
import proj4 from 'proj4';


angular.module('anol.scale')

/**
 * @ngdoc directive
 * @name anol.scale.directive:anolScaleLine
 *
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 *
 * @description
 * Add a ol scaleline to element directive is used in.
 * If element is defined inside anol-map-directive, scaleline is added to map
 */
.directive('anolScaleLine', ['MapService', 'ControlsService', function(MapService, ControlsService) {
    return {
        restrict: 'A',
        require: '^anolMap',
        replace: true,
        template: '<div class="anol-scale-line ol-unselectable"><div class="anol-scale-line-inner ol-control"></div></div>',
        scope: {},
        link: {
            post: function(scope, element, attrs) {
                scope.map = MapService.getMap();
                var anolScaleLineInner = element.find('.anol-scale-line-inner');
                var controlOptions = {
                    target: anolScaleLineInner[0],
                    units: 'metric'
                };
                var olControl = new ScaleLine(controlOptions);

                // For placement reason we need a container control
                var containerControl = new anol.control.Control({
                    element: element
                });
                var scaleControl = new anol.control.Control({
                    olControl: olControl
                });
                ControlsService.addControl(containerControl);
                ControlsService.addControl(scaleControl);
            }
        }
    };
}]);
