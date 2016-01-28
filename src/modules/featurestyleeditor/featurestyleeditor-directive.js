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
        if(style.strokeDashstyle === undefined) {
            style.strokeDashstyle = null;
        }
        return style;
    };

    var purgeStyle = function(_style) {
        var style = {};
        angular.forEach(_style, function(value, key) {
            if(value === undefined || value === '' || value === null) {
                return;
            }
            style[key] = value;
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
        link: function(scope, element, attrs) {
            var styleWatcher;
            // stores last feature style to compare
            // feature.get('style') contains only string values, but lastStyle contains right type for each property
            var lastStyle;
            scope.$watch('feature', function(feature) {
                if(styleWatcher !== undefined) {
                    styleWatcher();
                    styleWatcher = undefined;
                }
                if(feature !== undefined) {
                    scope.style = prepareStyleProperties(
                        feature.get('style') || {}
                    );
                    lastStyle = purgeStyle(angular.copy(scope.style));
                    scope.geometryType = feature.getGeometry().getType();

                    styleWatcher = scope.$watchCollection('style', function(_style) {
                        var style = purgeStyle(_style);
                        if(!angular.equals(style, lastStyle)) {
                            if(angular.equals(style, {})) {
                                feature.unset('style');
                            } else {
                                feature.set('style', style);
                            }
                            lastStyle = angular.copy(style);
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
    };
}]);
