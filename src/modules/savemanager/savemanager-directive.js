import { defaults } from './module.js';

angular.module('anol.savemanager')

/**
 * @ngdoc directive
 * @name anol.savemanager.directive:anolSavemanager
 *
 * @restrict A
 * @requires anol.savemanager.SaveManagerService
 *
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Provides save button for each saveable layer with changes
 */
.directive('anolSavemanager', ['$templateRequest', '$compile', 'SaveManagerService', 
    function($templateRequest, $compile, SaveManagerService) {
    return {
        restrict: 'A',
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return '<div></div>';
            }
            return require('./templates/savemanager.html')
        },                 
        scope: {},
        link: function(scope, element, attrs) {
            if (attrs.templateUrl && attrs.templateUrl !== '') {
                $templateRequest(attrs.templateUrl).then(function(html){
                    var template = angular.element(html);
                    element.html(template);
                    $compile(template)(scope);
                });
            }             
            scope.unsavedLayers = SaveManagerService.changedLayers;
            scope.changedFeatures = SaveManagerService.changedFeatures;

            scope.save = function(layer) {
                SaveManagerService.commit(layer).then(function() {
                    // TODO show success
                }, function() {
                    // TODO show or handle error
                });
            };
        }
    };
}]);