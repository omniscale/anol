import './module.js';

angular.module('anol.catalog')

/**
 * @ngdoc object
 * @name anol.catalog.CatalogServiceProvider
 */
.provider('CatalogService', [function() {
    var _catalogLayers = [];

    this.setLayers = function(layers) {
        _catalogLayers = layers;
    };

    this.$get = ['LayersService', function(LayersService) {
        /**
         * @ngdoc service
         * @name anol.catalog.CatalogService
         *
         * @description
         * Handles current catalog layer
         */
        var CatalogService = function(catalogLayers) {
            var self = this;
            this.catalogLayers = [];
            this.addedLayers = [];
            this.nameLayersMap = {};
            this.sortedLayers = {};
            this.firstLetters = [];
            
            angular.forEach(catalogLayers, function(_layer) {
                self.addCatalogLayer(_layer);
                if(_layer.name !== undefined) {
                    self.nameLayersMap[_layer.name] = _layer;
                }   
                
                var firstLetter = _layer.title.charAt(0).toUpperCase();
                if (self.firstLetters.indexOf(firstLetter) === -1) {
                    if (!_layer.catalog.visible) {
                        return;
                    }
                    self.firstLetters.push(firstLetter);
                    self.sortedLayers[firstLetter] = {
                        'layers':  [_layer],
                        'title': firstLetter
                    };
                } 
                else {
                    if (!_layer.catalog.visible) {
                        return;
                    }
                    self.sortedLayers[firstLetter]['layers'].push(_layer);
                }
            });

            var sortedLayers = {};
            if (!angular.equals({}, self.sortedLayers)) {
                Object.keys(self.sortedLayers).sort().reduce(function(acc, key) {
                    if (angular.isDefined(acc)) {
                        sortedLayers[acc] = self.sortedLayers[acc];
                    }
                    if (angular.isDefined(key)) {
                        sortedLayers[key] = self.sortedLayers[key];
                    }
                }) 
                self.sortedLayers = sortedLayers;
            }
        };

        /**
         * @ngdoc method
         * @name layerByName
         * @methodOf anol.map.CatalogService
         * @param {string} name
         * @returns {anol.layer.Layer} layer
         * @description Gets a layer by it's name
         */
        CatalogService.prototype.layerByName = function(name) {
            return this.nameLayersMap[name];
        };
        /**
         * @ngdoc method
         * @name layers
         * @methodOf anol.map.CatalogService
         * @returns {array.<anol.layer.Layer>} All layers
         * @description
         * Get all layers managed by catalog service
         */
        CatalogService.prototype.addedCatalogLayers = function() {
            var self = this;
            return self.addedLayers;
        };

        /**
         * @ngdoc method
         * @name addLayer
         * @methodOf anol.catalog.CatalogService
         * @param {Object} layer anolLayer
         * @description
         * Adds a layer to catalog
         */
        CatalogService.prototype.addCatalogLayer = function(layer) {
            // all catalog layers must display in layerswitcher
            layer.displayInLayerswitcher = true;
            this.catalogLayers.push(layer);
        };
        /**
         * @ngdoc method
         * @name addToMap
         * @methodOf anol.catalog.CatalogService
         * @param {Object} layer anolLayer
         * @description
         * Adds a catalog layer to map
         */
        CatalogService.prototype.addToMap = function(layer, visible) {
            if(this.catalogLayers.indexOf(layer) > -1 && this.addedLayers.indexOf(layer) === -1) {
                // add catalog layer to the top
                var added = LayersService.addOverlayLayer(layer, 0);
                layer.setVisible(visible)
                if(layer instanceof anol.layer.DynamicGeoJSON && added === true) {
                    layer.refresh();
                }
                this.addedLayers.push(layer);
                layer.olLayer.setZIndex(LayersService.zIndex + this.addedLayers.length)
            }
        };
        /**
         * @ngdoc method
         * @name removeFromMap
         * @methodOf anol.catalog.CatalogService
         * @param {Object} layer anolLayer
         * @description
         * Removes a catalog layer from map
         */
        CatalogService.prototype.removeFromMap = function(layer) {
            var layerIdx = this.addedLayers.indexOf(layer);
            if(this.catalogLayers.indexOf(layer) > -1 &&  layerIdx > -1) {
                LayersService.removeOverlayLayer(layer);
                this.addedLayers.splice(layerIdx, 1);
            }
        };
        return new CatalogService(_catalogLayers);
    }];
}]);