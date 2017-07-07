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

    this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.catalog.CatalogService
         *
         * @description
         * Handles current catalog layer
         */
        var CatalogService = function(catalogLayers) {
            var self = this;
            this.layers = [];
            angular.forEach(catalogLayers, function(layer) {
                self.addLayer(layer);
            });
        };
        /**
         * @ngdoc method
         * @name addLayer
         * @methodOf anol.catalog.CatalogService
         * @param {Object} layer anolLayer
         * @description
         * Adds a catalog layer
         */
        CatalogService.prototype.addLayer = function(layer) {
            this.layers.push(layer);
        };
        return new CatalogService(_catalogLayers);
    }];
}]);