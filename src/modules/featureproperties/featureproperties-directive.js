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
.directive('anolFeatureProperties', ['$translate', function($translate) {
    return {
        restrict: 'A',
        scope: {
            'feature': '=',
            'layer': '=',
            'translationNamespace': '@'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featureproperties/templates/featureproperties.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs) {
            scope.translationNamespace = angular.isDefined(scope.translationNamespace) ?
                scope.translationNamespace : 'featureproperties';

            scope.propertiesCollection = [];

            var featureChangeHandler = function(feature) {
                var propertiesCollection = [];
                if(scope.layer !== undefined && angular.isObject(scope.layer.featureinfo) && feature !== undefined) {
                    var properties = {};
                    angular.forEach(feature.getProperties(), function(value, key) {
                        if(
                            $.inArray(key, scope.layer.featureinfo.properties) > -1 &&
                            angular.isString(value) &&
                            value !== ''
                        ) {
                            properties[key] = {
                                key: key,
                                value: value
                            };
                            var translateKey = [scope.translationNamespace, scope.layer.name, key.toUpperCase()].join('.');
                            var translateValue = [scope.translationNamespace, scope.layer.name, key, value].join('.');
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
                    if(!angular.equals(properties, {})) {
                        propertiesCollection.push(properties);
                    }
                }
                scope.propertiesCollection = propertiesCollection;
            };

            scope.$watch('feature', featureChangeHandler);
        }
    };
}]);
