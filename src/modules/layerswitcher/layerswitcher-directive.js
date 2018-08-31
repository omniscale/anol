require('angular');

import { defaults } from './module.js';
import { TOUCH as hasTouch } from 'ol/has'

angular.module('anol.layerswitcher')

/**
 * @ngdoc directive
 * @name anol.layerswitcher.directive:anolLayerswitcher
 *
 * @restrict A
 * @requires anol.map.LayersService
 * @requires anol.map.ControlsService
 *
 * @param {string} anolLayerswitcher If containing "open" layerswitcher initial state is expanded. Otherweise it is collapsed.
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Shows/hides background- and overlaylayer
 */
 // TODO handle add / remove layer
 // TODO handle edit layers title
 .directive('anolLayerswitcher', ['$timeout', '$templateRequest', '$compile', 'LayersService', 'ControlsService', 'MapService',
  function($timeout, $templateRequest, $compile, LayersService, ControlsService, MapService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        transclude: true,
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return '<div></div>';
            }
            return require('./templates/layerswitcher.html')
        },
        scope: {
            anolLayerswitcher: '@anolLayerswitcher',
            tooltipPlacement: '@',
            tooltipDelay: '@',
            tooltipEnable: '@'
        },
        link: {
            pre: function(scope, element, attrs, AnolMapController) {
                if (attrs.templateUrl && attrs.templateUrl !== '') {
                    $templateRequest(attrs.templateUrl).then(function(html){
                        var template = angular.element(html);
                        element.html(template);
                        $compile(template)(scope);
                      });
                } 

                scope.collapsed = false;
                scope.showToggle = false;

                // attribute defaults
                scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
                    scope.tooltipPlacement : 'left';
                scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                    scope.tooltipDelay : 500;
                scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                    scope.tooltipEnable : !hasTouch;

                scope.backgroundLayers = LayersService.backgroundLayers;
                var overlayLayers = [];
                scope.overlayLayers = LayersService.overlayLayers;
                if(angular.isObject(AnolMapController)) {
                    scope.collapsed = scope.anolLayerswitcher !== 'open';
                    scope.showToggle = true;
                    ControlsService.addControl(
                        new anol.control.Control({
                            element: element
                        })
                    );
                }
            },
            post: function(scope, element, attrs) {
                scope.backgroundLayer = LayersService.activeBackgroundLayer();
                scope.$watch('backgroundLayer', function(newVal, oldVal) {
                    if(angular.isDefined(oldVal)) {
                        oldVal.setVisible(false);
                    }
                    if(angular.isDefined(newVal)) {
                        newVal.setVisible(true);
                    }
                });
                MapService.getMap().getLayers().on('add', function() {
                    scope.overlayLayers = LayersService.overlayLayers;
                });
            }
        },
        controller: function($scope, $element, $attrs) {
            $scope.sortableGroups = {
                'update': function() {
                    $timeout(function() {
                        LayersService.reorderGroupLayers();
                    });
                }
            }
            $scope.sortableLayer = {
                'update': function(e, ui) {
                    $timeout(function() {
                        LayersService.reorderOverlayLayers();
                    })
                }
            }
            $scope.isGroup = function(toTest) {
                var result = toTest instanceof anol.layer.Group;
                return result;
            };
            $scope.zoomToLayerExtent = function(layer) {
                if(!layer instanceof anol.layer.Feature) {
                    return;
                }
                var extent = layer.extent();
                if(extent === false) {
                    return;
                }
                var map = MapService.getMap();
                map.getView().fit(extent, map.getSize());
            };
            $scope.setBackgroundLayerByName = function(name) {
                $scope.backgroundLayer = LayersService.layerByName(name);
            };
            $scope.removeBackgroundLayer = function() {
                $scope.backgroundLayer = undefined;
            };
            $scope.layerByName = function(name) {
                return LayersService.layerByName(name);
            };
            $scope.layerIsVisibleByName = function(name) {
                var layer = LayersService.layerByName(name);
                if(layer !== undefined) {
                    return layer.getVisible();
                }
                return false;
            };
            $scope.toggleLayerVisibleByName = function(name) {
                var layer = LayersService.layerByName(name);
                if(layer !== undefined) {
                    layer.setVisible(!layer.getVisible());
                }
            };
            $scope.toggleGroupVisibleByName = function(name) {
                var group = LayersService.groupByName(name);
                if(group !== undefined) {
                    group.setVisible(!group.getVisible());
                }
            };
            $scope.groupIsVisibleByName = function(name) {
                var group = LayersService.groupByName(name);
                if(group !== undefined) {
                    return group.getVisible();
                }
                return false;
            };
        }
    };
}]);
