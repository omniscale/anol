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
        require: '?^anolMap',
        scope: {},
        link: {
            pre: function(scope, element, attrs, AnolMapController) {
                scope.map = MapService.getMap();

                var controlOptions = {};
                if(angular.isObject(AnolMapController)) {
                    element.addClass('ol-unselectable');
                    element.addClass('ol-control');
                    controlOptions = {
                        target: element[0]
                    };
                }

                var olControl = new ol.control.ScaleLine(controlOptions);
                var control = new anol.control.Control({
                    olControl: olControl
                });
                ControlsService.addControl(control);
            }
        }
    };
}]);
