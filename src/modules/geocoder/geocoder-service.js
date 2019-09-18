import './module.js';

angular.module('anol.geocoder')

/**
 * @ngdoc object
 * @name anol.map.GeocoderServiceProvice
 */
    .provider('GeocoderService', ['LayersServiceProvider', function(LayersServiceProvider) {
        var _configs = [];

        this.setGeocoderConfig = function(config) {
            _configs = _configs.concat(config);
        };

        var addConfig = function(config, type) {
            var found = false;
            angular.forEach(_configs, function(conf) {
                if (conf.name === config.name) {
                    found = true;
                }
            });
            if(!found) {
                config.type = type;
                _configs.push(config);
            }
        };

        var removeConfig = function(config) {
            var removeIdx = undefined;
            angular.forEach(_configs, function(conf, idx) {
                if (conf === config) {
                    removeIdx = idx;
                }
            });

            if (angular.isDefined(removeIdx)) {
                _configs.splice(removeIdx, 1);
            }
        }

        LayersServiceProvider.registerAddLayerHandler(function(layer) {
            if (layer.searchConfig && layer.searchConfig.length > 0) {
                angular.forEach(layer.searchConfig, function(config) {
                    addConfig(config, 'layer');
                });
            }
        });

        LayersServiceProvider.registerRemoveLayerHandler(function(layer) {
            if (layer.searchConfig && layer.searchConfig.length > 0) {
                angular.forEach(layer.searchConfig, function(config) {
                    removeConfig(config);
                });
            }
        });
        
        this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.map.GeocoderService
         *
         */
            var Geocoder = function(configs) {
                var self = this;
                self.configs = configs;
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
