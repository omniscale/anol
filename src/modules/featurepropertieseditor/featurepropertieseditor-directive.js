angular.module('anol.featurepropertieseditor')
/**
 * @ngdoc directive
 * @name anol.featurepropertieseditor.directive:anolFeaturePropertiesEditor
 *
 * @restrict A
 * @requires $modal
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {string} modalTemplateUrl Url to modal template to use instead of default one
 *
 * @description
 * Shows a modal for editing feature properties
 */
.directive('anolFeaturePropertiesEditor', ['$modal', function($modal) {
    return {
        restrict: 'A',
        scope: {
            modalTemplateUrl: '@'
        },
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
/**
 * @ngdoc controller
 * @name anol.featurepropertieseditor.controller:anolFeaturePropertiesEditorModalController
 *
 * @restrict A
 * @requires $scope
 * @requires $modalInstance
 * @requiresd properties
 *
 * @description
 * Controller for properties editor modal
 */
.controller('FeaturePropertiesEditorModalController', ['$scope', '$modalInstance', 'properties', function($scope, $modalInstance, properties) {
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
}]);
