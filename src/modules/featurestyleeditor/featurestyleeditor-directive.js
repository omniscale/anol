angular.module('anol.featurestyleeditor')
/**
 * @ngdoc directive
 * @name anol.featurestyleeditor.directive:anolFeatureStyleEditor
 *
 * @restrict A
 * @requires $modal
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {string} modalTemplateUrl Url to template to use for modal instead of default one
 *
 * @description
 * Shows a modal for editing feature style
 */
.directive('anolFeatureStyleEditor', ['$modal', function($modal) {
    return {
        restrict: 'A',
        scope: {
            modalTemplateUrl: '@'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurestyleeditor/templates/featurestyleeditor.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        transclude: true,
        link: function(scope, element, attrs) {
            scope.openEditor = function() {
                var defaultModalUrl = 'src/modules/featurestyleeditor/templates/featurestyleeditor-modal.html';
                var modalInstance = $modal.open({
                    templateUrl: scope.modalTemplateUrl || defaultModalUrl,
                    controller: 'FeatureStyleEditorModalController',
                    resolve: {
                        style: function () {
                            return scope.feature.getProperties().style || {};
                        },
                        geometryType: function() {
                            return scope.feature.getGeometry().getType();
                        }
                    }
                });
                modalInstance.result.then(function(style) {
                    if(!angular.equals(style, {})) {
                        scope.feature.set('style', style);
                    }
                    scope.feature = undefined;
                });
            };
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
 * @name anol.featurestyleeditor.controller:anolFeatureStyleEditorModalController
 *
 * @restrict A
 * @requires $rootScope
 * @requires $scope
 * @requires $modalInstance
 * @requires $translate
 * @requires style
 * @requires geometryType
 *
 * @description
 * Controller for style editor modal
 */
.controller('FeatureStyleEditorModalController', ['$rootScope', '$scope', '$modalInstance', '$translate', 'style', 'geometryType',
    function($rootScope, $scope, $modalInstance, $translate, style, geometryType) {
        $scope.style = style;
        $scope.geometryType = geometryType;

        var translate = function() {
            $translate([
                'anol.featurestyleeditor.SOLID',
                'anol.featurestyleeditor.DOT',
                'anol.featurestyleeditor.DASH',
                'anol.featurestyleeditor.DASHDOT',
                'anol.featurestyleeditor.LONGDASH',
                'anol.featurestyleeditor.LONGDASHDOT'
            ]).then(function(translations) {
                $scope.strokeDashStyles = [
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


        $scope.ok = function () {
            $modalInstance.close($scope.style);
        };
        $scope.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
}]);
