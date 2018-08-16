require('angular');

import { defaults } from './module.js';

angular.module('anol.featureproperties')
/**
 * @ngdoc directive
 * @name anol.featureproperties.directive:anolFeatureProperties
 *
 * @restrict A
 * @requires pascalprecht.$translate
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {ol.Feature} feature Feature to show properties for
 * @param {anol.layer.Feature} layer Layer of feature
 * @param {string} translationNamespace Namespace to use in translation table. Default "featureproperties".
 *
 * @description
 * Shows feature properties for layers with 'featureinfo' property.
 *
 * Layer property **featureinfo** - {Object} - Contains properties:
 * - **properties** {Array<String>} - Property names to display
 *
 * **Translating feature properties**
 * @example
 * ```
{
    "featureproperties": {
        "{layername}": {
            "PROPERTY_KEY": "{property key translation}",
            "property_key": {
                "property_value_1": "{property value 1 translation}",
                "property_value_2": "{property value 2 translation}"
            }
        }
    }
}```
 *
 *
 */
.directive('anolFeatureProperties', ['$templateRequest', '$compile', '$translate', 
    function($templateRequest, $compile, $translate) {
    return {
        restrict: 'A',
        require: '?^anolFeaturePopup',
        scope: {
            'feature': '=',
            'layer': '=',
            'selects': '=',
            'translationNamespace': '@'
        },
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return '<div></div>';
            }
            return require('./templates/featureproperties.html')
        },           
        link: function(scope, element, attrs, FeaturePopupController) {
            if (attrs.templateUrl && attrs.templateUrl !== '') {
                $templateRequest(attrs.templateUrl).then(function(html){
                    var template = angular.element(html);
                    element.html(template);
                    $compile(template)(scope);
                });
            } 
            scope.translationNamespace = angular.isDefined(scope.translationNamespace) ?
                scope.translationNamespace : 'featureproperties';

            scope.propertiesCollection = [];

            var propertiesFromFeature = function(feature, layerName, displayProperties) {
                var properties = {};
                angular.forEach(feature.getProperties(), function(value, key) {
                    if(
                        angular.isDefined(value) &&
                        value !== null &&
                        $.inArray(key, displayProperties) > -1 &&
                        value.length > 0
                    ) {
                        properties[key] = {
                            key: key,
                            value: value
                        };
                        var translateKey = [scope.translationNamespace, layerName, key.toUpperCase()].join('.');
                        var translateValue = [scope.translationNamespace, layerName, key, value].join('.');
                        // this get never rejected cause of array usage
                        // see https://github.com/angular-translate/angular-translate/issues/960
                        $translate([
                            translateKey,
                            translateValue
                        ]).then(
                            function(translations) {
                                var translatedKey = translations[translateKey];
                                var translatedValue = translations[translateValue];
                                if(translatedKey === translateKey) {
                                    translatedKey = key;
                                }
                                if(translatedValue === translateValue) {
                                    translatedValue = value;
                                }
                                properties[key] = {
                                    key: translatedKey,
                                    value: translatedValue
                                };
                            }
                        );
                    }
                });
                return properties;
            };

            var featureChangeHandler = function(feature) {
                var propertiesCollection = [];
                if(scope.layer === undefined || !angular.isObject(scope.layer.featureinfo)) {
                    scope.propertiesCollection = propertiesCollection;
                } else {
                    var properties = propertiesFromFeature(feature, scope.layer.name, scope.layer.featureinfo.properties);
                    if(!angular.equals(properties, {})) {
                        propertiesCollection.push(properties);
                    }
                    scope.propertiesCollection = propertiesCollection;
                }
                if(FeaturePopupController !== null && scope.propertiesCollection.length === 0) {
                    FeaturePopupController.close();
                }
            };

            var selectsChangeHandler = function(selects) {
                var propertiesCollection = [];
                angular.forEach(selects, function(selectObj) {
                    var layer = selectObj.layer;
                    var features = selectObj.features;
                    if(!angular.isObject(layer.featureinfo) || features.length === 0) {
                        return;
                    }
                    angular.forEach(features, function(feature) {
                        var properties = propertiesFromFeature(feature, layer.name, layer.featureinfo.properties);
                        if(!angular.equals(properties, {})) {
                            propertiesCollection.push(properties);
                        }
                    });
                });
                scope.propertiesCollection = propertiesCollection;
                if(FeaturePopupController !== null && scope.propertiesCollection.length === 0) {
                    FeaturePopupController.close();
                }
            };

            scope.$watch('feature', featureChangeHandler);
            scope.$watchCollection('selects', selectsChangeHandler);
        }
    };
}])

.directive('urlOrText', [function() {
    return {
        restrict: 'E',
        scope: {
            url: '=value'
        },
        link: function(scope, element, attrs) {
            var isUrl = function(s) {
                var regexp = /(http:\/\/|https:\/\/|www\.)/;
                return regexp.test(s);
            };
            scope.$watch('url', function(url) {
                var content = url;
                if(isUrl(url)) {
                    content = $('<a href="' + url + '">' + url + '</a>');
                }
                element.html(content);
            });
        }
    };
}]);
