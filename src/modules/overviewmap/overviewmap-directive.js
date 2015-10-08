angular.module('anol.overviewmap')

.directive('anolOverviewMap', ['ControlsService', 'LayersService', function(ControlsService, LayersService) {
    return {
        restrict: 'A',
        scope: {},
        link: function(scope, element, attrs) {
            var backgroundLayers = [];
            angular.forEach(LayersService.backgroundLayers, function(layer) {
                backgroundLayers.push(layer.olLayer);
            });
            var control = new anol.control.Control({
                olControl: new ol.control.OverviewMap({
                    layers: backgroundLayers,
                    label: null
                })
            });
            ControlsService.addControl(control);
        }
    };
}]);
