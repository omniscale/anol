require('angular');

import { defaults } from './module.js';
import GeoJSON from 'ol/format/GeoJSON';

angular.module('anol.savesettings')

/**
 * @ngdoc object
 * @name anol.savemanager.SaveManagerServiceProvider
 */
.provider('SaveSettingsService', ['LayersServiceProvider', function(LayersServiceProvider) {
    var _saveManagerInstance;
    var _saveUrl;
    var _loadUrl;
    var _deleteUrl;
    var _projectName;

    /**
     * @ngdoc method
     * @name setSaveUrl
     * @methodOf anol.savemanager.SaveManagerServiceProvider
     * @param {String} saveUrl url to save changes to. Might be overwritten by layer.saveUrl
     */
    this.setSaveUrl = function(saveUrl) {
        _saveUrl = saveUrl;
    };
    this.setLoadUrl = function(loadUrl) {
        _loadUrl = loadUrl;
    };
    this.setDeleteUrl = function(deleteUrl) {
        _deleteUrl = deleteUrl;
    };    
    this.setProjectName = function(projectName) {
        _projectName = projectName;
    };    
    this.$get = ['$rootScope', '$q', '$http', '$timeout', '$translate', 'PermalinkService', 'PrintPageService', 'ProjectSettings', 'LayersService',
        function($rootScope, $q, $http, $timeout, $translate, PermalinkService, PrintPageService, ProjectSettings, LayersService) {
        /**
         * @ngdoc service
         * @name anol.savemanager.SaveManagerService
         *
         * @description
         * Collects changes in saveable layers and send them to given saveUrl
         */
        var SaveSettings = function(saveUrl, loadUrl, deleteUrl, projectName) {
            var self = this;
            this.saveUrl = saveUrl;
            this.loadUrl = loadUrl;
            this.deleteUrl = deleteUrl;
            this.projectName = projectName;

            // this.changedLayers = {};
            // this.changedFeatures = {};
            var translate = function() {
                $translate('anol.savemanager.SERVICE_UNAVAILABLE').then(
                    function(translation) {
                    self.serviceUnavailableMessage = translation;
                });
            };
            $rootScope.$on('$translateChangeSuccess', translate);
            translate();            
        };

        SaveSettings.prototype.applySaveSettings = function(data) {
            if (data.new) {
                ProjectSettings.push({
                    'id': data.settings.id,
                    'name': data.settings.name
                });
            }
        }

        SaveSettings.prototype.applyDeleteSettings = function(data) {
            var index = -1;
            angular.forEach(ProjectSettings, function(value, idx) {
                if (value.id == data.settings.id) {
                    index = idx;
                }   
            });

            if (index > -1) {
              ProjectSettings.splice(index, 1);
            }
        }

        SaveSettings.prototype.applyLoadSettings = function(data) {
            PermalinkService.setPermalinkParameters(data.settings.map)

            LayersService.setLayerOrder(data.settings.layerswitcher.order);
            LayersService.setCollapsedGroups(data.settings.layerswitcher.open);
            
            // save print settings and check if print tab is open
            PrintPageService.loadSettings(data.settings);
        
            $rootScope.$broadcast("updateSidebar", data.settings);
            // load control settings
            $rootScope.pointMeasureResultSrs = data.settings.controls.measureSrs;
        };

        SaveSettings.prototype.load = function(id) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                'id': id
            }
            var promise = $http.post(self.loadUrl, data);
            promise.then(function(response) {
                self.applyLoadSettings(response.data);
                deferred.resolve(response.data);
            }, function(response) {
                if(response.status === -1) {
                    deferred.reject({'message': self.serviceUnavailableMessage});
                } else {
                    deferred.reject(response.data);
                }
            });
            
            return deferred.promise;
        };

        SaveSettings.prototype.save = function(name) {
            var self = this;
            var deferred = $q.defer();

            // save all map settings from permalink
            var permalinkData = PermalinkService.getSettings();
            // save all layer settings 
            var layers = LayersService.overLayersAsArray(); 

            var groups = LayersService.getCollapsedGroups(); 
            // save print settings
            var printData = PrintPageService.getSettings();
            // save control settings
            var controls = {
                'measureSrs': $rootScope.pointMeasureResultSrs
            }
            var data = {
                'projectName': self.projectName,
                'name': name,
                'map': permalinkData,
                'layerswitcher': {
                    'order': layers,
                    'open': groups
                },
                'controls': controls,
                'print': printData
            }
    
            var promise = $http.post(self.saveUrl, data);
            promise.then(function(response) {
                self.applySaveSettings(response.data);
                deferred.resolve(response.data);
            }, function(response) {
                if(response.status === -1) {
                    deferred.reject({'message': self.serviceUnavailableMessage});
                } else {
                    deferred.reject(response.data);
                }
            });
            
            return deferred.promise;
        };

        SaveSettings.prototype.delete = function(id) {
            var self = this;
            var deferred = $q.defer();
            var data = {
                'id': id
            }
            var promise = $http.post(self.deleteUrl, data);
            promise.then(function(response) {
                self.applyDeleteSettings(response.data);
                deferred.resolve(response.data);
            }, function(response) {
                if(response.status === -1) {
                    deferred.reject({'message': self.serviceUnavailableMessage});
                } else {
                    deferred.reject(response.data);
                }
            });
            
            return deferred.promise;
        }; 

        _saveManagerInstance = new SaveSettings(_saveUrl, _loadUrl, _deleteUrl, _projectName);
        return _saveManagerInstance;
    }];
}]);