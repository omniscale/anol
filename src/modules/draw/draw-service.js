angular.module('anol.draw')

/**
 * @ngdoc object
 * @name anol.draw.DrawServiceProvider
 */
.provider('DrawService', [function() {
    this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.draw.DrawService
         *
         * @description
         * Handles current draw layer
         */
        var DrawService = function() {
            this.layers = [];
            this.activeLayer = undefined;
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
            if(layer === undefined || this.layers.indexOf(layer) !== -1) {
                this.activeLayer = layer;
            }
        };

        return new DrawService();
    }];
}]);