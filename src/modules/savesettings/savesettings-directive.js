require('angular');

import { defaults } from './module.js';

angular.module('anol.savesettings')

.directive('anolSavesettings', ['$templateRequest', '$compile', 'SaveSettingsService', 
    function($templateRequest, $compile, SaveSettingsService) {
    return {
        restrict: 'A',
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return '<div></div>';
            }
            return require('./templates/savemanager.html')
        },        
        scope: {},
        link: function(scope, element, attrs, controllers) {
            if (attrs.templateUrl && attrs.templateUrl !== '') {
                $templateRequest(attrs.templateUrl).then(function(html){
                    var template = angular.element(html);
                    element.html(template);
                    $compile(template)(scope);
                });
            }        
            scope.list = [];
            scope.name = 'hello';
            scope.save = function(name) {
                SaveSettingsService.save(name).then(function() {
                    // TODO show success
                }, function() {
                    // TODO show or handle error
                });
            };
            scope.id = 1;
            scope.load = function(id) {
                SaveSettingsService.load(id).then(function(data) {
                    // TODO show success
                }, function() {
                    // TODO show or handle error
                });
            };                 
        }
    };
}])
