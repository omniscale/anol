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
            this.olLayers = [];
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
                var olLayers = [];
                if(layer instanceof anol.layer.Group) {
                    angular.forEach(layer.layers, function(_layer) {
                        olLayers.push(_layer.olLayer);
                    });
                } else {
                    olLayers.push(layer.olLayer);
                }
                self.map.addLayers(olLayers);
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
            if(_layer instanceof anol.layer.Group) {
                layers = _layer.layers;
            }
            angular.forEach(layers, function(layer) {
                self.olLayers.push(layer.olLayer);
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
         * @name getLayers
         * @methodOf anol.map.LayersService
         * @returns {Array.<anol.layer.Layers|anol.layer.Group>} layers
         * @description
         * Returns all layers
         */
        Layers.prototype.getLayers = function() {
            var self = this;
            return self.backgroundLayers.concat(self.overlayLayers);
        };
        return new Layers(_layers);
    }];
}]);
