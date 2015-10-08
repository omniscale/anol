angular.module('anol.featurepropertieseditor')

.directive('anolFeaturePropertiesEditor', ['$modal', function($modal) {
    return {
        restrict: 'A',
        scope: {},
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurepropertieseditor/templates/featurepropertieseditor.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        transclude: true,
        link: {
            pre: function(scope, element, attrs) {
                scope.openEditor = function() {
                    var defaultModalUrl = 'src/modules/featurepropertieseditor/templates/featurepropertieseditor-modal.html';
                    var modalInstance = $modal.open({
                        templateUrl: scope.modalTemplateUrl || defaultModalUrl,
                        controller: 'FeaturePropertiesEditorModalController',
                        resolve: {
                            properties: function () {
                                return scope.feature.getProperties();
                            }
                        }
                    });
                    modalInstance.result.then(function(properties) {
                        angular.forEach(properties, function(value, key) {
                            scope.feature.set(key, value);
                        });
                        scope.feature = undefined;
                    });
                };
            },
            post: function(scope, element, attrs) {
            }
        },
        controller: function($scope, $element, $attrs) {
            this.editFeature = function(feature) {
                $scope.feature = feature;
                $scope.openEditor();
            };
        }
    };
}])

.controller('FeaturePropertiesEditorModalController', function($scope, $modalInstance, properties) {
    delete properties.geometry;
    delete properties.style;
    $scope.properties = properties;

    $scope.ok = function () {
        $modalInstance.close($scope.properties);
    };
    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
    $scope.addProperty = function() {
        $scope.properties[$scope.newKey] = undefined;
        $scope.newKey = undefined;
    };
    $scope.removeProperty = function(key) {
        delete $scope.properties[key];
    };
});
