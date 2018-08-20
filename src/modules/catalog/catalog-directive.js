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
.directive('anolCatalog', ['$templateRequest', '$compile', 'LayersService', 'CatalogService',
    function($templateRequest, $compile, LayersService, CatalogService) {
    return {
        restrict: 'A',
        scope: {},
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return '<div></div>';
            }
            return require('./templates/catalog.html')
        },
        link: function(scope, element, attrs) {
            if (attrs.templateUrl && attrs.templateUrl !== '') {
                $templateRequest(attrs.templateUrl).then(function(html){
                    var template = angular.element(html);
                    element.html(template);
                    $compile(template)(scope);
                  });
            } 
            scope.layers = CatalogService.catalogLayers;

            scope.addedLayers = CatalogService.addedLayers;

            function groupLayers(layers) {
                var firstLetters = [];
                var sortedLayers = [];
                angular.forEach(layers, function(layer) {
                    var firstLetter = layer.title.charAt(0).toUpperCase();
                    if (firstLetters.indexOf(firstLetter) === -1) {
                        firstLetters.push(firstLetter);
                        sortedLayers[firstLetter] = [layer];
                    } else {
                        sortedLayers[firstLetter].push(layer);
                    }
                });
            }
            scope.sortedLayers = groupLayers(CatalogService.catalogLayers);

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
