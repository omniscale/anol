import './module.js';

angular.module('anol.scale')

/**
 * @ngdoc function
 * @name anol.scale.function:calculateScale
 *
 * @param {Object} view ol.View object
 *
 * @returns {number} current scale
 */
    .constant('calculateScale', function(view) {
        var INCHES_PER_METER = 1000 / 25.4;
        var DPI = 72;
        // found at https://groups.google.com/d/msg/ol3-dev/RAJa4locqaM/4AzBrkndL9AJ
        var resolution = view.getResolution();
        var mpu = view.getProjection().getMetersPerUnit();
        var scale = resolution * mpu * INCHES_PER_METER * DPI;
        return Math.round(scale);
    })

/**
 * @ngdoc directive
 * @name anol.scale.directive:anolScaleText
 *
 * @requires $timeout
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 * @requires anol.scale.calculateScale
 *
 * @description
 * Add scaletext to element directive is used in.
 * If element is defined inside anol-map-directive, scaletext is added to map
 */
    .directive('anolScaleText', ['$templateRequest', '$compile', '$timeout', 'MapService', 'ControlsService', 'calculateScale', 
        function($templateRequest, $compile, $timeout, MapService, ControlsService, calculateScale) {

            return {
                restrict: 'A',
                require: '?^anolMap',
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/scaletext.html');
                },         
                scope: {},
                link: {
                    pre: function(scope, element, attrs, AnolMapController) {
                        if (attrs.templateUrl && attrs.templateUrl !== '') {
                            $templateRequest(attrs.templateUrl).then(function(html){
                                var template = angular.element(html);
                                element.html(template);
                                $compile(template)(scope);
                            });
                        }                 
                        scope.view = MapService.getMap().getView();
                        if(angular.isObject(AnolMapController)) {
                            element.addClass('ol-unselectable');
                            element.addClass('ol-control');
                            ControlsService.addControl(
                                new anol.control.Control({
                                    element: element
                                })
                            );
                        }

                        scope.scale = calculateScale(scope.view);
                    },
                    post: function(scope) {
                        scope.view.on('change:resolution', function() {
                            // used $timeout instead of $apply to avoid "$apply already in progress"-error
                            $timeout(function() {
                                scope.scale = calculateScale(scope.view);
                            }, 0, true);
                        });

                    }
                }
            };
        }]);