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
        var INCHES_PER_UNIT = {
          'm': 39.37,
          'dd': 4374754
        };
        var DOTS_PER_INCH = 72;
        var units = view.getProjection().getUnits();

        var getScaleFromResolution = function(resolution, units) {
          var scale = INCHES_PER_UNIT[units] * DOTS_PER_INCH * resolution;
          return Math.round(scale);;
        };
        return getScaleFromResolution(view.getResolution(), units)
    })

/**
 * @ngdoc function
 * @name anol.scale.function:calculateResolution
 *
 * @param {Object} view ol.View object
 *
 * @returns {number} current resolution
 */
    .constant('calculateResolutionFromScale', function(view, scale) {
        var INCHES_PER_UNIT = {
          'm': 39.37,
          'dd': 4374754
        };
        var DOTS_PER_INCH = 72;
        var units = view.getProjection().getUnits();

        var getResolutionFromScale = function(scale, units) {
          var resolution = scale / INCHES_PER_UNIT[units] / DOTS_PER_INCH;
          return resolution;
        };
        return getResolutionFromScale(scale, units)
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
    .directive('anolScaleText', ['$templateRequest', '$compile', '$timeout', 'MapService', 'ControlsService', 'calculateScale', 'calculateResolutionFromScale',
        function($templateRequest, $compile, $timeout, MapService, ControlsService, calculateScale, calculateResolutionFromScale) {

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
                        scope.updateScale = function() {
                            if (scope.scale > 0) {
                                var resolution = calculateResolutionFromScale(scope.view, scope.scale) 
                                scope.view.setResolution(resolution)
                            }
                        }
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