import './module.js';

angular.module('anol.savesettings')

    .directive('anolSavesettings', ['$templateRequest', '$compile', 'SaveSettingsService', 'ProjectSettings', 'NotificationService',
        function($templateRequest, $compile, SaveSettingsService, ProjectSettings, NotificationService) {
            return {
                restrict: 'A',
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/savemanager.html');
                },        
                scope: {
                    modalCallBack:'&'
                },
                link: function(scope, element, attrs) {
            
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
                    };
                    scope.delete = function(id) {
                        SaveSettingsService.delete(id).then(function(data) {
                            NotificationService.addInfo(data.message);
                        }, function(data) {
                            NotificationService.addError(data.message);
                        });
                    };
                    scope.save = function(name) {
                        // load project name to overwrite
                        if (angular.isUndefined(name) || scope.id) { 
                            angular.forEach(scope.projectSettings, function(value) {
                                if (value.id == scope.id) {
                                    name = value.name;
                                }
                            });
                        }
                        if (angular.isUndefined(name) || name == '') {
                            return;
                        }
                        SaveSettingsService.save(name).then(function(data) {
                            scope.modalCallBack();
                            NotificationService.addInfo(data.message);
                        }, function(data) {
                            NotificationService.addError(data.message);
                        });
                    };
                    scope.load = function(id) {
                        if (angular.isUndefined(id)) {
                            return;
                        }
                        SaveSettingsService.load(id).then(function(data) {
                            scope.modalCallBack();
                            NotificationService.addInfo(data.message);
                        }, function(data) {
                            NotificationService.addError(data.message);
                        });
                    };                 
                }
            };
        }]);
