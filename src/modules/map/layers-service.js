angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.LayersServiceProvider
 */
.provider('LayersService', [function() {
    var _layers = [];
    var SaveManagerService;
    var DrawService;
    /**
     * @ngdoc method
     * @name setLayers
     * @methodOf anol.map.LayersServiceProvider
     * @param {Array.<Object>} layers ol3 layers
     */
    this.setLayers = function(layers) {
        _layers = _layers.concat(layers);
    };

    this.$get = ['$injector', '$rootScope', function($injector, $rootScope) {
        // inject Services when available
        if($injector.has('SaveManagerService')) {
            SaveManagerService = $injector.get('SaveManagerService');
        }
        if($injector.has('DrawService')) {
            DrawService = $injector.get('DrawService');
        }
        /**
         * @ngdoc service
         * @name anol.map.LayersService
         *
         * @description
         * Stores ol3 layerss and add them to map, if map present
         */
        var Layers = function(layers) {
            var self = this;
            self.map = undefined;

            // contains anol layers and groups
            self.layers = [];
            // contains all anol layers (grouped layers extracted from their groups)
            self.flattedLayers = [];
            // contains all olLayers like (grouped layers extracted from their groups)
            self.olLayers = [];
            // contains all anol background layers
            self.backgroundLayers = [];
            // contains all anol overlay layers or groups
            self.overlayLayers = [];
            self.nameLayersMap = {};
            self.nameGroupsMap = {};
            self.addLayers(layers);

            var activeBackgroundLayer;
            angular.forEach(self.backgroundLayers, function(backgroundLayer) {
                if(angular.isUndefined(activeBackgroundLayer) && backgroundLayer.getVisible()) {
                    activeBackgroundLayer = backgroundLayer;
                }
                self.nameLayersMap[backgroundLayer.name] = backgroundLayer;
            });
            if(angular.isUndefined(activeBackgroundLayer) && self.backgroundLayers.length > 0) {
                activeBackgroundLayer = self.backgroundLayers[0];
            }
            angular.forEach(self.backgroundLayers, function(backgroundLayer) {
                backgroundLayer.setVisible(angular.equals(activeBackgroundLayer, backgroundLayer));
            });
        };
        /**
         * @ngdoc method
         * @name registerMap
         * @methodOf anol.map.LayersService
         * @param {Object} map ol3 map object
         * @description
         * Register an ol3 map in `LayersService`
         */
        Layers.prototype.registerMap = function(map) {
            this.map = map;
        };
        /**
         * private function
         *
         * stores layer into background- or overlaylayers list
         * adds event handler to change:visible event
         */
        Layers.prototype.prepareLayer = function(layer) {
            var self = this;

            if(layer.isBackground) {
                self.backgroundLayers.push(layer);
            } else {
                self.overlayLayers.push(layer);
            }

            // while map is undefined, don't add layers to it
            // when map is created, all this.layers are added to map
            // after that, this.map is registered
            // so, when map is defined, added layers are not in map
            // and must be added
            if(self.map !== undefined) {
                if(layer instanceof anol.layer.Group) {
                    angular.forEach(layer.layers, function(_layer) {
                        self.map.addLayer(_layer.olLayer);
                    });
                } else {
                    self.map.addLayer(layer.olLayer);
                }
            }
        };
        /**
         * @ngdoc method
         * @name addLayer
         * @methodOf anol.map.LayersService
         * @param {Object} layer ol3 layer object
         * @description
         * Adds a single layer
         */
        Layers.prototype.addLayer = function(_layer) {
            var self = this;
            var layers = [_layer];
            self.prepareLayer(_layer);
            self.layers.push(_layer);
            if(_layer instanceof anol.layer.Group) {
                self.nameGroupsMap[_layer.name] = _layer;
                layers = _layer.layers;
            }
            angular.forEach(layers, function(layer) {
                self.flattedLayers.push(layer);
                self.olLayers.push(layer.olLayer);
                self.nameLayersMap[layer.name] = layer;
                if(SaveManagerService !== undefined && layer.saveable === true) {
                    SaveManagerService.addLayer(layer);
                }
                if(DrawService !== undefined && layer.editable === true) {
                    DrawService.addLayer(layer);
                }
            });
        };
        /**
         * @ngdoc method
         * @name addLayers
         * @methodOf anol.map.LayersService
         * @param {Array.<Object>} layers ol3 layers
         * @description
         * Adds an array of layers
         */
        Layers.prototype.addLayers = function(layers) {
            var self = this;
            angular.forEach(layers, function(layer) {
                self.addLayer(layer);
            });
        };
        /**
         * @ngdoc method
         * @name activeBbackgroundLayer
         * @methodOf anol.map.LayersService
         * @returns {anol.layer.Layer} backgroundLayer visible background layer
         * @description
         * Returns the visible background layer
         */
        Layers.prototype.activeBackgroundLayer = function() {
            var self = this;
            var backgroundLayer;
            angular.forEach(self.backgroundLayers, function(layer) {
                if(layer.getVisible() === true) {
                    backgroundLayer = layer;
                }
            });
            return backgroundLayer;
        };

        Layers.prototype.layerByName = function(name) {
            return this.nameLayersMap[name];
        };

        Layers.prototype.groupByName = function(name) {
            return this.nameGroupsMap[name];
        };
        return new Layers(_layers);
    }];
}]);
