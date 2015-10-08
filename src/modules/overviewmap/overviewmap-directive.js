angular.module('anol.overviewmap')

.directive('anolOverviewMap', ['ControlsService', 'LayersService', 'MapService', function(ControlsService, LayersService, MapService) {
    return {
        restrict: 'A',
        scope: {},
        link: function(scope, element, attrs) {
            var backgroundLayers = [];
            angular.forEach(LayersService.backgroundLayers, function(layer) {
                backgroundLayers.push(layer.olLayer);
            });
            var olControl = new ol.control.OverviewMap({
                layers: backgroundLayers,
                tipLabel: false,
                label: document.createTextNode(''),
                collapseLabel: document.createTextNode('')
            });
            var control = new anol.control.Control({
                olControl: olControl
            });
            // disable nativ tooltip
            /*var overviewmapButton = angular.element(olControl.element).find('button');
            overviewmapButton.removeAttr('title');*/

/*            var tooltip = new anol.Tooltip({
                text: 'Overview Map',
                bindTo: overviewmapButton
            });*/

            ControlsService.addControl(control);
        }
    };
}]);
