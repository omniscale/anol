import { defaults } from './module.js';

angular.module('anol.featurestyleeditor')
/**
 * @ngdoc directive
 * @name anol.featurestyleeditor.directive:anolFeatureStyleEditor
 *
 * @restrict A
 * @requires $rootScope
 * @requires $translate
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {ol.Feature} anolFeatureStyleEditor Feature to edit
 * @param {anol.layer.Feature} layer Layer feature belongs to
 * @param {boolean} formDisabled Disable style editor
 * @param {string} disabledText Text to display while styleeditor is disabled
 *
 * @description
 * Shows a form for editing feature style depending on its geometry type
 */
    .directive('anolFeatureStyleEditor', ['$templateRequest', '$compile', '$rootScope', '$translate', 
        function($templateRequest, $compile, $rootScope, $translate) {
            var prepareStyleProperties = function(_style) {
                var style = angular.copy(_style);
                if(style.radius !== undefined) {
                    style.radius = parseInt(style.radius);
                }
                if(style.strokeWidth !== undefined) {
                    style.strokeWidth = parseInt(style.strokeWidth);
                }
                if(style.strokeOpacity !== undefined) {
                    style.strokeOpacity = parseFloat(style.strokeOpacity);
                }
                if(style.fillOpacity !== undefined) {
                    style.fillOpacity = parseFloat(style.fillOpacity);
                }
                if(style.graphicRotation !== undefined) {
                    style.graphicRotation = parseFloat(style.graphicRotation);
                }
                return style;
            };

            var purgeStyle = function(_style) {
                var style = {};
                angular.forEach(_style, function(value, key) {
                    if(value === undefined || value === '' || value === null) {
                        style[key] = undefined;
                    } else {
                        style[key] = value;
                    }
                });
                return style;
            };

            return {
                restrict: 'A',
                scope: {
                    feature: '=anolFeatureStyleEditor',
                    layer: '=',
                    formDisabled: '=',
                    disabledText: '@'
                },
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/featurestyleeditor.html');
                },           
                link: {
                    pre: function(scope, element, attrs) {
                        if (attrs.templateUrl && attrs.templateUrl !== '') {
                            $templateRequest(attrs.templateUrl).then(function(html){
                                var template = angular.element(html);
                                element.html(template);
                                $compile(template)(scope);
                            });
                        }                 
                        element.addClass('anol-styleeditor');
                        var unregisterStyleWatcher;
                        scope.$watch('feature', function(feature) {
                            if(unregisterStyleWatcher !== undefined) {
                                unregisterStyleWatcher();
                                unregisterStyleWatcher = undefined;
                            }
                            var layerStyle = {};
                            if(scope.layer !== undefined && scope.layer.options !== undefined) {
                                layerStyle = prepareStyleProperties(scope.layer.options.style || {});
                            }

                            if(feature !== undefined) {
                                scope.style = prepareStyleProperties(
                                    $.extend(true, {}, layerStyle, feature.get('style'))
                                );
                                scope.geometryType = feature.getGeometry().getType();

                                unregisterStyleWatcher = scope.$watchCollection('style', function(_newStyle, _oldStyle) {
                                    var newStyle = purgeStyle(_newStyle);
                                    var oldStyle = purgeStyle(_oldStyle);
                                    var style = {};
                                    // only add changed values
                                    angular.forEach(newStyle, function(value, key) {
                                        if(oldStyle[key] !== value) {
                                            style[key] = value;
                                        }
                                        if(layerStyle[key] === value) {
                                            style[key] = undefined;
                                        }
                                    });
                                    var featureStyle = feature.get('style') || {};
                                    var combinedStyle = angular.extend({}, featureStyle, style);
                                    if(angular.equals(combinedStyle, {})) {
                                        feature.unset('style');
                                    } else {
                                        feature.set('style', combinedStyle);
                                    }
                                });
                            }
                        });

                        var disableOverlay;
                        var addOverlay = function() {
                            disableOverlay = angular.element('<div class="anol-styleeditor-disabled-overlay"></div>');
                            if(scope.disabledText !== undefined) {
                                var disabledText = angular.element('<p class="anol-styleeditor-disabled-text">' + scope.disabledText + '</p>');
                                disableOverlay.append(disabledText);
                            }
                            element.append(disableOverlay);
                        };

                        var removeOverlay = function() {
                            disableOverlay.remove();
                            disableOverlay = undefined;
                        };

                        scope.$watch('formDisabled', function(n, o) {
                            if(o === true) {
                                removeOverlay();
                            }
                            if(n === true) {
                                addOverlay();
                            }
                        });

                        var translate = function() {
                            $translate([
                                'anol.featurestyleeditor.SOLID',
                                'anol.featurestyleeditor.DOT',
                                'anol.featurestyleeditor.DASH',
                                'anol.featurestyleeditor.DASHDOT',
                                'anol.featurestyleeditor.LONGDASH',
                                'anol.featurestyleeditor.LONGDASHDOT'
                            ]).then(function(translations) {
                                scope.strokeDashStyles = [
                                    {value: 'solid', label: translations['anol.featurestyleeditor.SOLID']},
                                    {value: 'dot', label: translations['anol.featurestyleeditor.DOT']},
                                    {value: 'dash', label: translations['anol.featurestyleeditor.DASH']},
                                    {value: 'dashdot', label: translations['anol.featurestyleeditor.DASHDOT']},
                                    {value: 'longdash', label: translations['anol.featurestyleeditor.LONGDASH']},
                                    {value: 'longdashdot', label: translations['anol.featurestyleeditor.LONGDASHDOT']}
                                ];
                            });
                        };
                        $rootScope.$on('$translateChangeSuccess', translate);
                        translate();
                    }
                }
            };
        }]);
