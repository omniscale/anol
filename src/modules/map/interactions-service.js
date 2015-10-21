angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.InteractionsServiceProvider
 */
.provider('InteractionsService', [function() {
    var _interactions, _dragZoomStyle;

    /**
     * @ngdoc method
     * @name setInteractions
     * @methodOf anol.map.InteractionsServiceProvider
     * @param {Array.<Object>} interactions ol3 interactions
     */
    this.setInteractions = function(interactions) {
        _interactions = interactions;
    };
    /**
     * @ngdoc method
     * @name setDragZoomStyle
     * @methodOf anol.map.InteractionsServiceProvider
     * @param {ol.style.Style} dragZoomStyle Style for drag zoom box
     *
     * @description
     * Defines style of drag zoom box if default interactions (no interactions explicit set) are used
     */
    this.setDragZoomStyle = function(dragZoomStyle) {
        _dragZoomStyle = dragZoomStyle;
    };

    this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.map.InteractionsService
         *
         * @description
         * Stores ol3 interactions and add them to map, if map present
         */
        var Interactions = function(interactions, dragZoomStyle) {
            this.map = undefined;

            if(interactions !== undefined) {
                this.interactions = interactions;
                return;

            }
            if(dragZoomStyle !== undefined) {
                this.interactions = ol.interaction.defaults({
                    shiftDragZoom: false
                });
                this.interactions.push(new ol.interaction.DragZoom({
                    style: dragZoomStyle
                }));
                return;
            }
            this.interactions = ol.interaction.defaults();
        };
        /**
         * @ngdoc method
         * @name registerMap
         * @methodOf anol.map.InteractionsService
         * @param {Object} map ol3 map object
         * @description
         * Registers an ol3 map in `InteractionsService`
         */
        Interactions.prototype.registerMap = function(map) {
            this.map = map;
        };
        /**
         * @ngdoc method
         * @name addInteraction
         * @methodOf anol.map.InteractionsService
         * @param {Object} interaction ol3 interaction
         * @description
         * Adds an ol3 interaction
         */
        Interactions.prototype.addInteraction = function(interaction) {
            if(this.map !== undefined) {
                this.map.addInteraction(interaction);
            }
            this.interactions.push(interaction);
        };
        /**
         * @ngdoc method
         * @name addInteractions
         * @methodOf anol.map.InteractionsService
         * @param {Array.<Object>} interactions ol3 interactions
         * @description
         * Adds an ol3 interactions
         */
        Interactions.prototype.addInteractions = function(interactions) {
            var self = this;
            if(this.map !== undefined) {
                angular.forEach(interactions, function(interaction) {
                    self.map.addInteraction(interaction);
                });
            }
            this.interactions = this.interactions.concat(interactions);
        };
        /**
         * @ngdoc method
         * @name removeInteraction
         * @methodOf anol.map.InteractionsService
         * @param {Object} interaction ol3 interaction object to remove
         * @description
         * Removes given ol3 interaction
         */
        Interactions.prototype.removeInteraction = function(interaction) {
            this.map.removeInteraction(interaction);
            var idx = $.inArray(this.interactions, interaction);
            if(idx !== -1) {
                this.interactions.splice(idx, 1);
            }
        };
        return new Interactions(_interactions, _dragZoomStyle);
    }];
}]);
