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
    this.$get = ['$rootScope', '$q', '$http', '$timeout', '$translate', 'PermalinkService', 'PrintPageService',
        function($rootScope, $q, $http, $timeout, $translate, PermalinkService, PrintPageService) {
        /**
         * @ngdoc service
         * @name anol.savemanager.SaveManagerService
         *
         * @description
         * Collects changes in saveable layers and send them to given saveUrl
         */
        var SaveSettings = function(saveUrl, loadUrl) {
            var self = this;
            this.saveUrl = saveUrl;
            this.loadUrl = loadUrl;

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
            PermalinkService.setPermalinkParameters(data.settings.map)

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

        SaveSettings.prototype.save = function(name) {
            var self = this;
            var deferred = $q.defer();

            // save all map settings from permalink
            var permalinkData = PermalinkService.getSettings();

            // save print settings
            var printData = PrintPageService.getSettings();
        
            // save control settings
            var controls = {
                'measureSrs': $rootScope.pointMeasureResultSrs
            }
            var data = {
                'name': name,
                'map': permalinkData,
                'controls': controls,
                'print': printData
            }
    
            var promise = $http.post(self.saveUrl, data);
            promise.then(function(response) {
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
        _saveManagerInstance = new SaveSettings(_saveUrl, _loadUrl);
        return _saveManagerInstance;
    }];
}]);