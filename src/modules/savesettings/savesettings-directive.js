import { defaults } from './module.js';

angular.module('anol.savesettings')

.directive('anolSavesettings', ['$templateRequest', '$compile', 'SaveSettingsService', 'ProjectSettings', 'NotificationService',
    function($templateRequest, $compile, SaveSettingsService, ProjectSettings, NotificationService) {
    return {
        restrict: 'A',
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return '<div></div>';
            }
            return require('./templates/savemanager.html')
        },        
        scope: {
            modalCallBack:'&'
        },
        link: function(scope, element, attrs, controllers) {
            
            if (attrs.templateUrl && attrs.templateUrl !== '') {
                $templateRequest(attrs.templateUrl).then(function(html){
                    var template = angular.element(html);
                    element.html(template);
                    $compile(template)(scope);
                });
            }    

            scope.projectSettings = ProjectSettings;
            scope.close = function() {
                scope.modalCallBack();
            }
            scope.delete = function(id) {
                SaveSettingsService.delete(id).then(function(data) {
                    NotificationService.addInfo(data.message)
                }, function() {
                    NotificationService.addError(data.message)
                });
            };
            scope.save = function(name) {
                // load project name to overwrite
                if (name === undefined || scope.id) { 
                    angular.forEach(scope.projectSettings, function(value) {
                        if (value.id == scope.id) {
                            name = value.name;
                        }
                    });
                }
                if (name == undefined || name == '') {
                    return;
                }
                SaveSettingsService.save(name).then(function(data) {
                    scope.modalCallBack();
                    NotificationService.addInfo(data.message)
                }, function() {
                    NotificationService.addError(data.message)
                });
            };
            scope.load = function(id) {
                if (id === undefined) {
                    return;
                }
                SaveSettingsService.load(id).then(function(data) {
                    scope.modalCallBack();
                    NotificationService.addInfo(data.message)
                }, function() {
                    NotificationService.addError(data.message)
                });
            };                 
        }
    };
}])
