angular.module('anol.featurepropertieseditor')
/**
 * @ngdoc directive
 * @name anol.featurepropertieseditor.directive:anolFeaturePropertiesEditor
 *
 * @restrict A
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {ol.Feature} anolFeaturePropertiesEditor Feature to edit
 *
 * @description
 * Shows a form for editing feature properties
 */
.directive('anolFeaturePropertiesEditor', [function() {
    return {
        restrict: 'A',
        scope: {
            feature: '=anolFeaturePropertiesEditor'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurepropertieseditor/templates/featurepropertieseditor.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs) {
            scope.properties = {};
            var propertyWatchers = [];

            var ignoreProperty = function(key) {
                if(key === 'geometry') {
                    return true;
                }
                if(key === 'style') {
                    return true;
                }
                if(key.startsWith('_')) {
                    return true;
                }
                return false;
            };

            var registerPropertyWatcher = function(key) {
                var watcher = scope.$watch(function() {
                    return scope.properties[key];
                }, function(n) {
                    if(n === undefined) {
                        scope.feature.unset(key);
                    } else if(n !== scope.feature.get(key)) {
                        scope.feature.set(key, n);
                    }
                });
                propertyWatchers.push(watcher);
            };

            var clearPropertyWatchers = function() {
                while(propertyWatchers.length > 0) {
                    var dewatch = propertyWatchers.pop();
                    dewatch();
                }
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
                if(feature !== undefined) {
                    scope.properties = feature.getProperties();
                    angular.forEach(scope.propertiesNames(), registerPropertyWatcher);
                }
            });
        }
    };
}]);
