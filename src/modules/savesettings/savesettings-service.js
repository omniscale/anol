import './module.js';

angular.module('anol.savesettings')

/**
 * @ngdoc object
 * @name anol.savemanager.SaveManagerServiceProvider
 */
    .provider('SaveSettingsService', [function() {
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
        this.$get = ['$rootScope', '$window', '$q', '$http', '$timeout', '$translate', 'PermalinkService', 'PrintPageService', 'ProjectSettings', 'LayersService', 'CatalogService',
            function($rootScope, $window, $q, $http, $timeout, $translate, PermalinkService, PrintPageService, ProjectSettings, LayersService, CatalogService) {
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
                    if (data.settings.new) {
                        ProjectSettings.push({
                            'id': data.settings.id,
                            'name': data.settings.name
                        });
                    }
                };

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
                };

                SaveSettings.prototype.applyLoadSettings = function(settings) {
                    PermalinkService.setPermalinkParameters(settings.map).then(function(data) {
                        LayersService.deleteLayers(settings.layerswitcher.deleted);
                        LayersService.setLayerOrder(settings.layerswitcher.order);
                        LayersService.setCollapsedGroups(settings.layerswitcher.open);
                    })
            
                    // save print settings and check if print tab is open
                    PrintPageService.loadSettings(settings);
        
                    $rootScope.$broadcast('updateSidebar', settings);
                    // load control settings
                    $rootScope.pointMeasureResultSrs = settings.controls.measureSrs;

                    if (settings.controls.catalogVariant) {
                        CatalogService.setVariant(settings.controls.catalogVariant);
                    }
                };

                SaveSettings.prototype.load = function(id) {
                    var self = this;
                    var deferred = $q.defer();
                    // if ajax is false we use redirect to load page settings
                    var ajax = false;
                    var data = {
                        'id': id,
                        'ajax': false,
                        'project_name': self.projectName
                    };
                    var promise = $http.post(self.loadUrl, data);
                    promise.then(function(response) {
                        if (ajax) {
                            self.applyLoadSettings(response.data.settings);
                        } else {  
                            $window.location.href = response.data.redirect;
                        }
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
                    var deletedLayers = LayersService.deletedOverlayLayers;

                    var groups = LayersService.getCollapsedGroups(); 
                    // save print settings
                    var printData = PrintPageService.getSettings();
                    // save control settings
                    var controls = {
                        'measureSrs': $rootScope.pointMeasureResultSrs,
                        'catalogVariant': CatalogService.getVariant(), 
                    };
                    var data = {
                        'projectName': self.projectName,
                        'name': name,
                        'map': permalinkData,
                        'layerswitcher': {
                            'order': layers,
                            'deleted': deletedLayers,
                            'open': groups
                        },
                        'controls': controls,
                        'print': printData
                    };

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
                    };
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