import './module.js';

angular.module('anol.geocoder')

/**
 * @ngdoc object
 * @name anol.map.GeocoderServiceProvice
 */
    .provider('GeocoderService', [function() {
        var _configs = [];

        this.setGeocoderConfig = function(config) {
            _configs = _configs.concat(config);
        };

        this.$get = ['$rootScope', 'LayersService', function($rootScope, LayersService) {
        /**
         * @ngdoc service
         * @name anol.map.GeocoderService
         *
         */
            var Geocoder = function(configs, addLayerHandlers, removeLayerHandlers) {
                var self = this;
                self.addLayerHandlers = addLayerHandlers;
                self.removeLayerHandlers = removeLayerHandlers;
                self.configs = configs;

                $rootScope.$watchCollection(function() {
                    return LayersService.layers();
                }, function(newVal) {
                    if(angular.isDefined(newVal)) {
                        angular.forEach(newVal, function(layer) {
                            if (layer.groupLayer) {
                                angular.forEach(layer.layers, function(glayer) {
                                    if (glayer.searchConfig && glayer.searchConfig.length > 0) {
                                        angular.forEach(glayer.searchConfig, function(config) {
                                            self.addConfig(config, 'layer');
                                        });
                                    }
                                });
                            }
                            if (angular.isDefined(layer)) {
                                if (layer.searchConfig && layer.searchConfig.length > 0) {
                                    angular.forEach(layer.searchConfig, function(config) {
                                        self.addConfig(config, 'layer');
                                    });
                                }
                            }
                        });
                      }
                    }
                );

            };

            Geocoder.prototype.addConfig = function(config, type) {
                var self = this;
                var found = false;
                angular.forEach(self.configs, function(conf) {
                    if (conf.name === config.name) {
                        found = true;
                    }
                });

                // prevent adding geocoder twice
                if(found) {
                    return false;
                }

                if (angular.isUndefined(type)) {
                    type = 'base';
                }
                config.type = type;
                self.configs.push(config);
                return true;
            };

            Geocoder.prototype.removeConfig = function(config) {
                var self = this;
                angular.forEach(self.configs, function(conf, idx) {
                    if (conf === config) {
                        self.overlayLayers.splice(idx, 1);
                    }
                });
            };

            Geocoder.prototype.getConfigs = function() {
                return this.configs;
            };

            Geocoder.prototype.configByName = function(name) {
                return this.configs[name];
            };
     
            return new Geocoder(_configs);
        }];
    }]);
