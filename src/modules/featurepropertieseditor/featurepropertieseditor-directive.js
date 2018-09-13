import './module.js';

angular.module('anol.featurepropertieseditor')
/**
 * @ngdoc directive
 * @name anol.featurepropertieseditor.directive:anolFeaturePropertiesEditor
 *
 * @restrict A
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {ol.Feature} anolFeaturePropertiesEditor Feature to edit
 * @param {anol.layer.Feature} layer Layer of feature
 *
 * @description
 * Shows a form for editing feature properties
 */
    .directive('anolFeaturePropertiesEditor', ['$templateRequest', '$compile', 
        function($templateRequest, $compile) {
            return {
                restrict: 'A',
                scope: {
                    feature: '=anolFeaturePropertiesEditor',
                    layer: '='
                },
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/featurepropertieseditor.html');
                },           
                link: function(scope, element, attrs) {
                    if (attrs.templateUrl && attrs.templateUrl !== '') {
                        $templateRequest(attrs.templateUrl).then(function(html){
                            var template = angular.element(html);
                            element.html(template);
                            $compile(template)(scope);
                        });
                    } 
                    scope.properties = {};
                    var propertyWatchers = {};

                    // TODO move into anol.layer.Feature
                    var ignoreProperty = function(key) {
                        if(key === 'geometry') {
                            return true;
                        }
                        if(key === 'style') {
                            return true;
                        }
                        return false;
                    };

                    var registerPropertyWatcher = function(key) {
                        if(ignoreProperty(key) || angular.isDefined(propertyWatchers[key])) {
                            return;
                        }
                        var watcher = scope.$watch(function() {
                            return scope.properties[key];
                        }, function(n) {
                            if(angular.isUndefined(n)) {
                                scope.feature.unset(key);
                            } else if(n !== scope.feature.get(key)) {
                                scope.feature.set(key, n);
                            }
                        });
                        propertyWatchers[key] = watcher;
                    };

                    var clearPropertyWatchers = function() {
                        angular.forEach(propertyWatchers, function(dewatch) {
                            dewatch();
                        });
                        propertyWatchers = {};
                    };

                    scope.propertiesNames = function() {
                        var result = [];
                        angular.forEach(scope.properties, function(value, key) {
                            if(ignoreProperty(key)) {
                                return;
                            }
                            result.push(key);
                        });
                        return result;
                    };

                    scope.handleAddPropertyKeydown = function(event) {
                        if(event.key === 'Enter' || event.keyCode === 13) {
                            scope.addProperty();
                        }
                    };

                    scope.addProperty = function() {
                        if(scope.newKey) {
                            scope.properties[scope.newKey] = '';
                            scope.feature.set(scope.newKey, '');
                            scope.newKey = '';
                        }
                    };
                    scope.removeProperty = function(key) {
                        delete scope.properties[key];
                        scope.feature.unset(key);
                    };

                    scope.$watch('feature', function(feature) {
                        clearPropertyWatchers();
                        scope.properties = {};
                        if(angular.isDefined(feature)) {
                            scope.properties = feature.getProperties();
                        }
                    });
                    scope.$watchCollection('properties', function(properties) {
                        angular.forEach(properties, function(value, key) {
                            registerPropertyWatcher(key);
                        });
                    });
                }
            };
        }]);
