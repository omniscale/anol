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
                            let template = angular.element(html);
                            element.html(template);
                            $compile(template)(scope);
                        });
                    } 
                    scope.variant = scope.$parent.variant;
                    scope.showLayers = scope.$parent.showLayers;
                    if (scope.variant === 'mouseover') {
                        scope.popoverEnabled = true;
                    } else {
                        scope.popoverEnabled = false;
                    }
                    scope.defaultAbstractLimit = 200;
                    scope.sortedLayers = CatalogService.sortedLayers;
                    scope.sortedGroups = CatalogService.sortedGroups;
                   
                    scope.addedGroups = CatalogService.addedGroups;
                    scope.addedLayers = CatalogService.addedLayers;
                                        
                    scope.addToMap = function(layer) {
                        CatalogService.addToMap(layer, true);
                    };
                    scope.addGroupToMap = function(group) {
                        CatalogService.addGroupToMap(group, true);
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
        }])

        .filter('catalogFilter', function(){
            return function(dataArray, searchTerm, variant) {
                if (!dataArray) {
                    return;
                }
                else if (!searchTerm) {
                    return dataArray;
                }
                else {
                    var term = searchTerm.toLowerCase();
                    return dataArray.filter(function(item){
                        var terminTitle = item.catalog.title.toLowerCase().indexOf(term) > -1;
                        if (item.abstract && variant === 'abstract') {
                            var termInAbstract = item.abstract.toLowerCase().indexOf(term) > -1;
                            return terminTitle || termInAbstract;
                        } else {
                            return terminTitle;
                        }
                    });
                } 
            };
        });
