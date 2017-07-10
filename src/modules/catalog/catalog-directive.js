angular.module('anol.catalog')
/**
 * @ngdoc directive
 * @name anol.catalog.anolCatalog
 *
 * @description
 * Provides a catalog of layers that can be added to map
 */
.directive('anolCatalog', ['LayersService', 'CatalogService',
    function(LayersService, CatalogService) {
    return {
        restrict: 'A',
        scope: {},
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/catalog/templates/catalog.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs) {
            scope.layers = CatalogService.catalogLayers;
            scope.addedLayers = CatalogService.addedLayers;

            scope.addedLayers = CatalogService.addedLayers;

            scope.addToMap = function(layer) {
                CatalogService.addToMap(layer);
            };
            scope.removeFromMap = function(layer) {
                CatalogService.removeFromMap(layer);
            };
        }
    };
}]);
