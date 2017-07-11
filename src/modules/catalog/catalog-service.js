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
            angular.forEach(catalogLayers, function(layer) {
                self.addCatalogLayer(layer);
            });
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
        CatalogService.prototype.addToMap = function(layer) {
            if(this.catalogLayers.indexOf(layer) > -1 && this.addedLayers.indexOf(layer) === -1) {
                var added = LayersService.addOverlayLayer(layer);
                if(layer instanceof anol.layer.DynamicGeoJSON && added === true) {
                    layer.refresh();
                }
                this.addedLayers.push(layer);
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