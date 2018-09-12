import { defaults } from './module.js';
import { defaults as interactionDefaults } from 'ol/interaction';

angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.InteractionsServiceProvider
 */
    .provider('InteractionsService', [function() {
        var _interactions;
        var _customInteractions;
        /**
     * @ngdoc method
     * @name setInteractions
     * @methodOf anol.map.InteractionsServiceProvider
     * @param {Array.<Object>} interactions ol interactions
     */
        this.setInteractions = function(interactions) {
            _interactions = interactions;
        };

        this.setCustomInteractions = function(interactions) {
            _customInteractions = interactions;
 
        };
        this.$get = [function() {
        /**
         * @ngdoc service
         * @name anol.map.InteractionsService
         *
         * @description
         * Stores ol interactions and add them to map, if map present
         */
            var Interactions = function(interactions, customInteractions) {
                this.map = undefined;

                this.interactions = interactionDefaults(interactions);
                var self = this;
                if (customInteractions) {
                    angular.forEach(customInteractions, function(interaction) {
                        self.addInteraction(interaction);
                    });
                }
            };
            /**
         * @ngdoc method
         * @name registerMap
         * @methodOf anol.map.InteractionsService
         * @param {Object} map ol map object
         * @description
         * Registers an ol map in `InteractionsService`
         */
            Interactions.prototype.registerMap = function(map) {
                var self = this;
                self.map = map;
                angular.forEach(self.interactions, function(interaction) {
                    self.map.addInteraction(interaction);
                });
            };
            /**
         * @ngdoc method
         * @name addInteraction
         * @methodOf anol.map.InteractionsService
         * @param {Object} interaction ol interaction
         * @description
         * Adds an ol interaction
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
         * @param {Array.<Object>} interactions ol interactions
         * @description
         * Adds an ol interactions
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
         * @param {Object} interaction ol interaction object to remove
         * @description
         * Removes given ol interaction
         */
            Interactions.prototype.removeInteraction = function(interaction) {
                this.map.removeInteraction(interaction);
                var idx = $.inArray(this.interactions, interaction);
                if(idx !== -1) {
                    this.interactions.splice(idx, 1);
                }
            };
            return new Interactions(_interactions, _customInteractions);
        }];
    }]);
