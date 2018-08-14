require('angular');

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
.directive('anolSavemanager', ['SaveManagerService', function(SaveManagerService) {
    return {
        restrict: 'A',
        templateUrl: function(tElement, tAttrs) {
            // var defaultUrl = 'src/modules/savemanager/templates/savemanager.html';
            // return tAttrs.templateUrl || defaultUrl;
            return require('./templates/savemanager.html')
        },
        scope: {},

        link: function(scope, element, attrs) {
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