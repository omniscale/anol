angular.module('anol.mouseposition')

/**
 * @ngdoc directive
 * @name anol.mouseposition.directive:anolMousePosition
 *
 * @requires $compile
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 *
 * @param {number@} precision Number of decimal digets coordinates are round to
 * @param {projectionCode=} Variable containing projection coordinates are displayed in
 *
 * @description
 * Shows current mouse position in map units in container or
 * in map if directive devined in `anolMapDirective`
 *
 * *anolMousePosition* have to contain a format string for displaying coordinates.
 * Therefor *anolMousePosition* prepate 3 variables to be placed in format string.
 * - *x* for x-position
 * - *y* for y-position
 * - *mapUnits* for current map units
 *
 *  @example
 * ```html
    <div anol-mouse-position >{{x}} {{ mapUnits }} {{y}} {{ mapUnits }}</div>
    ```
 */
.directive('anolMousePosition', ['$compile', 'MapService', 'ControlsService', function($compile, MapService, ControlsService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        scope: {
            precision: '@',
            projectionCode: '='
        },
        link: {
            pre: function(scope, element, attrs) {
                $compile(element.contents())(scope);
                scope.map = MapService.getMap();
                if(angular.isDefined(scope.projectionCode)) {
                    scope.projection = ol.proj.get(scope.projectionCode);
                } else {
                    scope.projection = scope.map.getView().getProjection();
                    scope.projectionCode = scope.projection.getCode();
                }
                scope.mapUnits = scope.projection.getUnits();

                scope.precision = parseInt(scope.precision || 0);
            },
            post: function(scope, element, attrs, AnolMapController) {
                var inMap = angular.isObject(AnolMapController);
                var olControl = new ol.control.MousePosition({
                    coordinateFormat: function(coordinate) {
                        scope.x = coordinate[0].toFixed(scope.precision);
                        scope.y = coordinate[1].toFixed(scope.precision);
                        scope.$digest();
                        return inMap ? element.html() : '';
                    }
                });

                var control = new anol.control.Control({
                    olControl: olControl
                });

                if(!inMap) {
                    element.css('display', 'inherit');
                }
                scope.$watch('projectionCode', function(newVal) {
                    if(angular.isDefined(newVal)) {
                        scope.projection = ol.proj.get(newVal);
                        scope.mapUnits = scope.projection.getUnits();
                        olControl.setProjection(scope.projection);
                    }
                });

                ControlsService.addControl(control);
            }
        }
    };
}]);
