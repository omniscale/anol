require('angular');

import { defaults } from './module.js';

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
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return tAttrs.templateUrl;
            }
            return require('./templates/catalog.html')
        },
        link: function(scope, element, attrs) {
            scope.layers = CatalogService.catalogLayers;

            scope.addedLayers = CatalogService.addedLayers;

            scope.addToMap = function(layer) {
                CatalogService.addToMap(layer);
            };
            scope.removeFromMap = function(layer) {
                CatalogService.removeFromMap(layer);
            };
            scope.toggleLayerVisible = function(layer) {
                if(layer !== undefined) {
                    layer.setVisible(!layer.getVisible());
                }
            };
        }
    };
}]);
