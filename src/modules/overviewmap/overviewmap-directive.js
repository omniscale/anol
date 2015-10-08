angular.module('anol.overviewmap')

.directive('anolOverviewMap', ['ControlsService', function(ControlsService) {
    return {
        restrict: 'A',
        scope: {},
        link: function(scope, element, attrs) {
            var control = new anol.control.Control({
                olControl: new ol.control.OverviewMap()
            });
            ControlsService.addControl(control);
        }
    };
}]);
