import './module.js';

angular.module('anol.catalog')
/**
 * @ngdoc directive
 * @name anol.catalog.anolCatalog
 *
 * @description
 * Provides a catalog of layers that can be added to map
 */
    .directive('anolCatalog', ['$templateRequest', '$compile', '$timeout', 'LayersService', 'CatalogService',
        function($templateRequest, $compile, $timeout, LayersService, CatalogService) {
            return {
                restrict: 'EA',
                scope: {
                    model:'='
                },
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/catalog.html');
                },
                link: function(scope, element, attrs) {
                    if (attrs.templateUrl && attrs.templateUrl !== '') {
                        $templateRequest(attrs.templateUrl).then(function(html){
                            var template = angular.element(html);
                            element.html(template);
                            $compile(template)(scope);
                        });
                    } 
                    scope.sortedLayers = CatalogService.sortedLayers;
                    scope.addedLayers = CatalogService.addedLayers;
                                        
                    scope.addToMap = function(layer) {
                        var visible = true;
                        CatalogService.addToMap(layer, visible);
                    };
                    scope.removeFromMap = function(layer) {
                        CatalogService.removeFromMap(layer);
                    };
                    scope.toggleLayerVisible = function(layer) {
                        if(angular.isDefined(layer)) {
                            layer.setVisible(!layer.getVisible());
                        }
                    };
                }
            };
        }]);
