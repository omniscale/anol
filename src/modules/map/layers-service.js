angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.LayersServiceProvider
 */
.provider('LayersService', [function() {
    var _layers = [];
    var _addLayerHandlers = [];
    /**
     * @ngdoc method
     * @name setLayers
     * @methodOf anol.map.LayersServiceProvider
     * @param {Array.<Object>} layers ol3 layers
     */
    this.setLayers = function(layers) {
        _layers = _layers.concat(layers);
    };
    /**
     * @ngdoc method
     * @name registerAddLayerHandler
     * @methodOf anol.map.LayersServiceProvider
     * @param {function} handler
     * register a handler called for each added layer
     */
    this.registerAddLayerHandler = function(handler) {
        _addLayerHandlers.push(handler);
    };

    this.$get = ['$rootScope', function($rootScope) {
        /**
         * @ngdoc service
         * @name anol.map.LayersService
         *
         * @description
         * Stores ol3 layerss and add them to map, if map present
         */
        var Layers = function(layers, addLayerHandlers) {
            var self = this;
            self.map = undefined;
            self.addLayerHandlers = addLayerHandlers;

            // contains all anol background layers
            self.backgroundLayers = [];
            // contains all anol overlay layers or groups
            self.overlayLayers = [];
            // contains all anol layers used internaly by modules
            self.systemLayers = [];
            self.nameLayersMap = {};
            self.nameGroupsMap = {};

            angular.forEach(layers, function(layer) {
                if(layer.isBackground) {
                    self.addBackgroundLayer(layer);
                } else {
                    self.addOverlayLayer(layer);
                }
            });

            var activeBackgroundLayer;
            angular.forEach(self.backgroundLayers, function(backgroundLayer) {
                if(angular.isUndefined(activeBackgroundLayer) && backgroundLayer.getVisible()) {
                    activeBackgroundLayer = backgroundLayer;
                }
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
         * @ngdoc method
         * @name addBackgroundLayer
         * @methodOf anol.map.LayersService
         * @param {anol.layer} layer Background layer to add
         * @param {number} idx Position to add backgorund layer at
         * @description
         * Adds a background layer
         */
        Layers.prototype.addBackgroundLayer = function(layer, idx) {
            var self = this;
            idx = idx || self.backgroundLayers.length;
            self.backgroundLayers.splice(idx, 0, layer);
            self._prepareLayer(layer);
        };
        /**
         * @ngdoc method
         * @name addOverlayLayer
         * @methodOf anol.map.LayersService
         * @param {anol.layer} layer Overlay layer to add
         * @param {number} idx Position to add overlay layer at
         * @description
         * Adds a overlay layer
         */
        Layers.prototype.addOverlayLayer = function(layer, idx) {
            var self = this;
            // layers added reversed to map, so default idx is 0 to add layer "at top"
            idx = idx || 0;
            self.overlayLayers.splice(idx, 0, layer);
            self._prepareLayer(layer);
        };
        Layers.prototype.addSystemLayer = function(layer, idx) {
            var self = this;
            idx = idx || 0;
            self.systemLayers.splice(idx, 0, layer);
        };
        /**
         * private function
         * Added ol layer to map when present
         * Executes addLayer handlers
         */
        Layers.prototype._prepareLayer = function(layer) {
            var self = this;

            var layers = [layer];
            if(layer instanceof anol.layer.Group) {
                if(layer.name !== undefined) {
                    self.nameGroupsMap[layer.name] = layer;
                }
                layers = layer.layers;
            }

            angular.forEach(layers, function(_layer) {
                if(_layer.name !== undefined) {
                    self.nameLayersMap[_layer.name] = _layer;
                }
            });

            angular.forEach(layers, function(_layer) {
                // start create olLayer / olSource
                var olSource = new _layer.OL_SOURCE_CLASS(_layer.olSourceOptions);
                var layerOpts = _layer.olLayerOptions;
                layerOpts.source = olSource;
                var olLayer = new _layer.OL_LAYER_CLASS(layerOpts);
                _layer.setOlLayer(olLayer);
                // end

                angular.forEach(self.addLayerHandlers, function(handler) {
                    handler(_layer);
                });
            });

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
         * @name layers
         * @methodOf anol.map.LayersService
         * @returns {array.<anol.layer.Layer>} All layers, including groups
         * @description
         * Get all layers managed by layers service
         */
        Layers.prototype.layers = function() {
            var self = this;
            return self.backgroundLayers.concat(self.overlayLayers);
        };
        /**
         * @ngdoc method
         * @name flattedLayers
         * @methodOf anol.map.LayersService
         * @returns {Array.<anol.layer.Layer>} flattedLayers
         * @description
         * Returns all layers except groups. Grouped layers extracted from their gropus.
         */
        Layers.prototype.flattedLayers = function() {
            var self = this;
            var flattedLayers = [];
            angular.forEach(self.layers(), function(layer) {
                if(layer instanceof anol.layer.Group) {
                    flattedLayers = flattedLayers.concat(layer.layers);
                } else {
                    flattedLayers.push(layer);
                }
            });
            return flattedLayers;
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
        /**
         * @ngdoc method
         * @name layerByName
         * @methodOf anol.map.LayersService
         * @param {string} name
         * @returns {anol.layer.Layer} layer
         * @description Gets a layer by it's name
         */
        Layers.prototype.layerByName = function(name) {
            return this.nameLayersMap[name];
        };
        /**
         * @ngdoc method
         * @name groupByName
         * @methodOf anol.map.LayersService
         * @param {string} name
         * @returns {anol.layer.Group} group
         * @description Gets a group by it's name
         */
        Layers.prototype.groupByName = function(name) {
            return this.nameGroupsMap[name];
        };
        return new Layers(_layers, _addLayerHandlers);
    }];
}]);
