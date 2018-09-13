import './module.js';

angular.module('anol.draw')

/**
 * @ngdoc object
 * @name anol.draw.DrawServiceProvider
 */
    .provider('DrawService', ['LayersServiceProvider', function(LayersServiceProvider) {
        var _drawServiceInstance;
        var _editableLayers = [];

        LayersServiceProvider.registerAddLayerHandler(function(layer) {
            if(layer.editable !== true) {
                return;
            }
            if(angular.isDefined(_drawServiceInstance)) {
                _drawServiceInstance.addLayer(layer);
            } else {
                _editableLayers.push(layer);
            }
        });
        this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.draw.DrawService
         *
         * @description
         * Handles current draw layer
         */
            var DrawService = function(editableLayers) {
                var self = this;
                this.layers = [];
                this.activeLayer = undefined;
                angular.forEach(editableLayers, function(layer) {
                    self.addLayer(layer);
                });
            };
            /**
         * @ngdoc method
         * @name addLayer
         * @methodOf anol.draw.DrawService
         * @param {Object} layer anolLayer
         * @description
         * Adds a draw layer
         */
            DrawService.prototype.addLayer = function(layer) {
                this.layers.push(layer);
            };
            /**
         * @ngdoc method
         * @name changeLayer
         * @methodOf anol.draw.drawService
         * @param {Object} layer anolLayer to draw on. undefined to deactivate drawing
         * @description
         * Sets current draw layer
         */
            DrawService.prototype.changeLayer = function(layer) {
                if(angular.isUndefined(layer) || this.layers.indexOf(layer) !== -1) {
                    this.activeLayer = layer;
                }
            };
            return new DrawService(_editableLayers);
        }];
    }]);