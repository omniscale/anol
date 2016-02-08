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
 *
 * @description
 * Shows a form for editing feature style depending on its geometry type
 */
.directive('anolFeatureStyleEditor', ['$rootScope', '$translate', function($rootScope, $translate) {
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
            layer: '='
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurestyleeditor/templates/featurestyleeditor.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: {
            pre: function(scope, element, attrs) {
                var styleWatcher;
                scope.$watch('feature', function(feature) {
                    if(styleWatcher !== undefined) {
                        styleWatcher();
                        styleWatcher = undefined;
                    }
                    if(feature !== undefined) {
                        scope.style = prepareStyleProperties(
                            feature.get('style') || {}
                        );
                        scope.geometryType = feature.getGeometry().getType();

                        styleWatcher = scope.$watchCollection('style', function(_newStyle, _oldStyle) {
                            var newStyle = purgeStyle(_newStyle);
                            var oldStyle = purgeStyle(_oldStyle);
                            var style = {};
                            // only add changed values
                            angular.forEach(newStyle, function(value, key) {
                                if(oldStyle[key] !== value) {
                                    style[key] = value;
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
