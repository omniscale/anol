angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.LayersServiceProvider
 */
.provider('LayersService', [function() {
    var _layers = [];

    /**
     * @ngdoc method
     * @name setLayers
     * @methodOf anol.map.LayersServiceProvider
     * @param {Array.<Object>} layers ol3 layers
     */
    this.setLayers = function(layers) {
        _layers = _layers.concat(layers);
    };

    this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.map.LayersService
         *
         * @description
         * Stores ol3 layerss and add them to map, if map present
         */
        var Layers = function(layers) {
            this.map = undefined;
            this.layers = [];
            this.backgroundLayers = [];
            this.overlayLayers = [];
            this.addLayers(layers);
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
        Layers.prototype.prepareLayers = function(layers) {
            var self = this;
            angular.forEach(layers, function(layer) {
                if(layer.get('isBackground')) {
                    self.backgroundLayers.push(layer);
                } else {
                    self.overlayLayers.push(layer);
                }
                if(layer instanceof ol.layer.Group) {
                    var visible = false;
                    angular.forEach(layer.getLayersArray(), function(groupLayer) {
                        if(groupLayer.getVisible() === true) {
                            visible = true;
                        }
                        groupLayer.set('syncGroupVisibleChangeKey', groupLayer.on('change:visible', function(evt) {
                            self.groupedLayerVisibleChangeHandler(evt, layer);
                        }));
                    });
                    layer.setVisible(visible);
                    layer.set('syncGroupVisibleChangeKey', layer.on('change:visible', function(evt) {
                        self.groupLayerVisibleChangeHandler(evt);
                    }));
                }
                // while map is undefined, don't add layers to it
                // when map is created, all this.layers are added to map
                // after that, this.map is registered
                // so, when map is defined, added layers are not in map
                // and must be added
                if(self.map !== undefined) {
                    self.map.addLayer(layer);
                }
            });
        };
        /**
         * private function
         *
         * updates child layers visible
         */
        Layers.prototype.groupLayerVisibleChangeHandler = function(evt)  {
            var self = this;
            var group = evt.target;
            angular.forEach(group.getLayersArray(), function(layer) {
                layer.unByKey(layer.get('syncGroupVisibleChangeKey'));
                layer.setVisible(group.getVisible());
                layer.set('syncGroupVisibleChangeKey', layer.on('change:visible', function(evt) {
                    self.groupedLayerVisibleChangeHandler(evt, group);
                }));
            });
        };
        /**
         * private function
         *
         * updates parent layer visible
         */
        Layers.prototype.groupedLayerVisibleChangeHandler = function(evt, group)  {
            var self = this;
            var layer = evt.target;
            var visible = layer.getVisible();
            var groupVisible = group.getVisible();

            if(visible && !groupVisible) {
                groupVisible = true;
            } else if(!visible && groupVisible) {
                groupVisible = false;
                angular.forEach(group.getLayersArray(), function(groupLayer) {
                    if(groupLayer.getVisible()) {
                        groupVisible = true;
                    }
                });
            }
            group.unByKey(group.get('syncGroupVisibleChangeKey'));
            group.setVisible(groupVisible);
            group.set('syncGroupVisibleChangeKey', group.on('change:visible', function(evt) {
                self.groupLayerVisibleChangeHandler(evt);
            }));
        };
        /**
         * @ngdoc method
         * @name addLayer
         * @methodOf anol.map.LayersService
         * @param {Object} layer ol3 layer object
         * @description
         * Adds a single layer
         */
        Layers.prototype.addLayer = function(layer) {
            var self = this;
            self.prepareLayers([layer]);

            self.layers.push(layer);
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
            self.prepareLayers(layers);

            self.layers = self.layers.concat(layers);
        };
        /**
         * @ngdoc method
         * @name backgroundLayer
         * @methodOf anol.map.LayersService
         * @returns {Array.<Object>} backgroundLayers all background layers
         * @description
         * Returns all background layers
         */
        Layers.prototype.backgroundLayer = function() {
            var backgroundLayer;
            angular.forEach(this.backgroundLayers, function(layer) {
                if(layer.getVisible() === true) {
                    backgroundLayer = layer;
                }
            });
            return backgroundLayer;
        };
        /**
         * @ngdoc method
         * @name layersByProperty
         * @methodOf anol.map.LayersService
         * @param {string} key property name
         * @param {string} value property value
         * @returns {Array.<Object>} all layer with key = value
         * @description
         * Returns all layers with key matching value
         */
        Layers.prototype.layersByProperty = function(key, value) {
            var self = this;
            var layers = [];
            angular.forEach(self.layers, function(layer) {
                if(layer.get(key) === value) {
                    layers.push(layer);
                }
            });
            return layers;
        };
        return new Layers(_layers);
    }];
}]);
