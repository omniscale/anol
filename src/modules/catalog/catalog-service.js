import './module.js';

angular.module('anol.catalog')

/**
 * @ngdoc object
 * @name anol.catalog.CatalogServiceProvider
 */
.provider('CatalogService', [function() {
    var _catalogLayers = [];
    var _catalogGroups = [];

    this.setLayers = function(layers) {
        _catalogLayers = layers;
    };

    this.setGroups = function(groups) {
        _catalogGroups = groups;
    };
    
    this.$get = ['LayersService', function(LayersService) {
        /**
         * @ngdoc service
         * @name anol.catalog.CatalogService
         *
         * @description
         * Handles current catalog layer
         */
        var CatalogService = function(catalogLayers, catalogGroups) {
            var self = this;
            this.catalogLayers = [];
            this.catalogGroups = [];
            this.addedLayers = [];
            this.addedGroups = [];
            this.nameLayersMap = {};
            this.nameGroupsMap = {};
            this.sortedLayers = {};
            this.sortedGroups = {};
            this.firstLetters = [];
            this.firstLettersGroups = [];
            this.addedGroupsLength = 0;
            this.variant = undefined;

            // Catalog Layers
            angular.forEach(catalogLayers, function(_layer) {
                self.addCatalogLayer(_layer);
                if(_layer.name !== undefined) {
                    self.nameLayersMap[_layer.name] = _layer;
                }   
                
                var firstLetter = _layer.title.charAt(0).toUpperCase();
                if (_layer.catalog && _layer.catalog.title) {
                    firstLetter = _layer.catalog.title.charAt(0).toUpperCase();
                }
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

            // Catalog Groups
            angular.forEach(catalogGroups, function(_group) {
                self.addCatalogGroup(_group);
                if(_group.name !== undefined) {
                    self.nameGroupsMap[_group.name] = _group;
                }   
                
                var firstLetter = _group.title.charAt(0).toUpperCase();
                if (_group.catalog && _group.catalog.title) {
                    firstLetter = _group.catalog.title.charAt(0).toUpperCase();
                }

                if (self.firstLettersGroups.indexOf(firstLetter) === -1) {
                    if (!_group.catalog.visible) {
                        return;
                    }
                    self.firstLettersGroups.push(firstLetter);
                    self.sortedGroups[firstLetter] = {
                        'layers':  [_group],
                        'title': firstLetter
                    };
                } 
                else {
                    if (!_group.catalog.visible) {
                        return;
                    }
                    self.sortedGroups[firstLetter]['layers'].push(_group);
                }
            });

            var sortedGroups = {};
            if (!angular.equals({}, self.sortedGroups)) {
                Object.keys(self.sortedGroups).sort().reduce(function(acc, key) {
                    if (angular.isDefined(acc)) {
                        sortedGroups[acc] = self.sortedGroups[acc];
                    }
                    if (angular.isDefined(key)) {
                        sortedGroups[key] = self.sortedGroups[key];
                    }
                }) 
                self.sortedGroups = sortedGroups;
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
         * @name groupByName
         * @methodOf anol.map.CatalogService
         * @param {string} name
         * @returns {anol.layer.Layer} layer
         * @description Gets a layer by it's name
         */
        CatalogService.prototype.groupByName = function(name) {
            return this.nameGroupsMap[name];
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
         * @name groups
         * @methodOf anol.map.CatalogService
         * @returns {array.<anol.layer.Group>} All layers
         * @description
         * Get all layers managed by catalog service
         */
        CatalogService.prototype.addedCatalogGroups = function() {
            var self = this;
            return self.addedGroups;
        };
                /**
         * @ngdoc method
         * @name setVariant
         * @methodOf anol.map.CatalogService
         * @param {string} variant  
         * @description
         * Set variant of catalog service
         */
        CatalogService.prototype.setVariant = function(variant) {
            this.variant = variant;
        };  
        /**
         * @ngdoc method
         * @name getVariant
         * @methodOf anol.map.CatalogService
         * @returns {string} Variant
         * @description
         * Get variant of catalog service
         */
        CatalogService.prototype.getVariant = function() {
            var self = this;
            return self.variant;
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
         * @name addLayer
         * @methodOf anol.catalog.CatalogService
         * @param {Object} group anolGroup
         * @description
         * Adds a layer to catalog
         */
        CatalogService.prototype.addCatalogGroup = function(group) {
            // all catalog layers must display in layerswitcher
            // layer.displayInLayerswitcher = true;
            this.catalogGroups.push(group);
        };
        /**
         * @ngdoc method
         * @name addGroupToMap
         * @methodOf anol.catalog.CatalogService
         * @param {Object} group anolGroup
         * @description
         * Adds a catalog group to map
         */
        CatalogService.prototype.addGroupToMap = function(group, visible) {
            var self = this;
            if(self.catalogGroups.indexOf(group) > -1 && self.addedGroups.indexOf(group) === -1) {
                LayersService.addOverlayLayer(group, 0);
                angular.forEach(self.addedGroups, function(_group) {
                    angular.forEach(_group.layers, function(_layers) {
                        self.addedGroupsLength++;
                    });
                });      
                var startZIndex = LayersService.zIndex + self.addedLayers.length + group.layers.length
                angular.forEach(group.layers, function(_layers) {
                    _layers.olLayer.setZIndex(startZIndex);
                    startZIndex--;
                });
                self.addedGroups.push(group);
                group.setVisible(visible);
            }
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
            var self = this;
            if(self.catalogLayers.indexOf(layer) > -1 && self.addedLayers.indexOf(layer) === -1) {
                // add catalog layer to the top
                layer.setVisible(visible)
                var added = LayersService.addOverlayLayer(layer, 0);
                if(layer instanceof anol.layer.DynamicGeoJSON && added === true) {
                    layer.refresh();
                }
                self.addedLayers.push(layer);
                layer.olLayer.setZIndex(LayersService.zIndex + self.addedLayers.length + self.addedGroupsLength)
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
            if(layer instanceof anol.layer.Group) {
                var groupIdx = this.addedGroups.indexOf(layer);
                if(this.catalogGroups.indexOf(layer) > -1 && groupIdx > -1) {
                    LayersService.removeOverlayLayer(layer);
                    this.addedGroups.splice(groupIdx, 1);
                }
            } else {
                var layerIdx = this.addedLayers.indexOf(layer);
                if(this.catalogLayers.indexOf(layer) > -1 && layerIdx > -1) {
                    LayersService.removeOverlayLayer(layer);
                    this.addedLayers.splice(layerIdx, 1);
                }

                if (layerIdx == -1) {
                    if (layer.anolGroup) {
                        // remove group if it is the las layer
                        var group = layer.anolGroup;
                        if (group.layers.length === 1) {
                            var groupIdx = this.addedGroups.indexOf(group);
                            if(this.catalogGroups.indexOf(group) > -1 && groupIdx > -1) {
                                LayersService.removeOverlayLayer(group);
                                this.addedGroups.splice(groupIdx, 1);
                            }
                        } else {
                            LayersService.removeOverlayLayer(layer);
                        }
                    }
                }
            } 
        };
        return new CatalogService(_catalogLayers, _catalogGroups);
    }];
}]);
