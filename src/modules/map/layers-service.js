require('angular');

import { defaults } from './module.js'
import { PopupsService } from '../featurepopup/featurepopup-service.js'

angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.LayersServiceProvider
 */
.provider('LayersService', [function() {
    var _layers = [];
    var _addLayerHandlers = [];
    var _removeLayerHandlers = [];
    var _clusterDistance = 50;
    /**
     * @ngdoc method
     * @name setLayers
     * @methodOf anol.map.LayersServiceProvider
     * @param {Array.<Object>} layers ol3 layers
     */
    this.setLayers = function(layers) {
        _layers = _layers.concat(layers);
    };
    this.setClusterDistance = function(distance) {
        _clusterDistance = distance;
    };
    /**
     * @ngdoc method
     * @name registerAddLayerHandler
     * @methodOf anol.map.LayersServiceProvider
     * @param {function} handler
     * register a handler called for each added layer
     */
    this.registerAddLayerHandler = function(handler) {
        _addLayerHandlers.push(handler);
    };

    this.registerRemoveLayerHandler = function(handler) {
        _removeLayerHandlers.push(handler);
    };

    this.$get = ['$rootScope', 'MapService', 'PopupsService', function($rootScope, MapService, PopupsService) {
        /**
         * @ngdoc service
         * @name anol.map.LayersService
         *
         * @description
         * Stores ol3 layerss and add them to map, if map present
         */
        var Layers = function(layers, addLayerHandlers, removeLayerHandlers, clusterDistance) {
            var self = this;
            self.map = undefined;
            self.addLayerHandlers = addLayerHandlers;
            self.removeLayerHandlers = removeLayerHandlers;
            self.clusterDistance = clusterDistance;

            // contains all anol background layers
            self.backgroundLayers = [];
            // contains all anol overlay layers or groups
            self.overlayLayers = [];
            // contains all anol layers used internaly by modules
            self.systemLayers = [];
            self.nameLayersMap = {};
            self.nameGroupsMap = {};

            self.olLayers = [];
            self.idx = 0;
            self.addedLayers = [];

            angular.forEach(layers, function(layer) {
                if(layer.isBackground) {
                    self.addBackgroundLayer(layer);
                } else {
                    self.addOverlayLayer(layer);
                }
            });
            self.reorderGroupLayers();

            var activeBackgroundLayer;
            angular.forEach(self.backgroundLayers, function(backgroundLayer) {
                if(angular.isUndefined(activeBackgroundLayer) && backgroundLayer.getVisible()) {
                    activeBackgroundLayer = backgroundLayer;
                }
            });
            if(angular.isUndefined(activeBackgroundLayer) && self.backgroundLayers.length > 0) {
                activeBackgroundLayer = self.backgroundLayers[0];
            }
            angular.forEach(self.backgroundLayers, function(backgroundLayer) {
                backgroundLayer.setVisible(angular.equals(activeBackgroundLayer, backgroundLayer));
            });
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
            var self = this;
            self.map = map;
            angular.forEach(self.backgroundLayers, function(layer) {
                self._addLayer(layer, true);
            });
            angular.forEach(self.overlayLayers, function(layer, idx) {
                if(layer instanceof anol.layer.Group) {
                    angular.forEach(layer.layers.slice().reverse(), function(grouppedLayer, idx) {
                        if(self.olLayers.indexOf(grouppedLayer.olLayer) < 0) {
                            self._addLayer(grouppedLayer, false);
                        }
                    });
                } else {
                    if(self.olLayers.indexOf(layer.olLayer) < 0) {
                        self._addLayer(layer, false);
                    }
                }
            });
            angular.forEach(self.systemLayers, function(layer) {
                self._addLayer(layer, true);
            });
        };
        /**
         * @ngdoc method
         * @name addBackgroundLayer
         * @methodOf anol.map.LayersService
         * @param {anol.layer} layer Background layer to add
         * @param {number} idx Position to add backgorund layer at
         * @description
         * Adds a background layer
         */
        Layers.prototype.addBackgroundLayer = function(layer, idx) {
            var self = this;
            idx = idx || self.backgroundLayers.length;
            self.backgroundLayers.splice(idx, 0, layer);
            self._prepareLayer(layer);
        };
        /**
         * @ngdoc method
         * @name addOverlayLayer
         * @methodOf anol.map.LayersService
         * @param {anol.layer} layer Overlay layer to add
         * @param {number} idx Position to add overlay layer at
         * @description
         * Adds a overlay layer
         */
        Layers.prototype.addOverlayLayer = function(layer, idx) {
            var self = this;
            // prevent adding layer twice
            if(self.overlayLayers.indexOf(layer) > -1) {
                return false;
            }
            idx = idx || 0;
            // layers added reversed to map, so default idx is 0 to add layer "at top"
            self.overlayLayers.splice(idx, 0, layer);
            self._prepareLayer(layer);

            if(layer instanceof anol.layer.Group) {
                angular.forEach(layer.layers, function(_layer) {
                    _layer.onVisibleChange(function() {
                        PopupsService.closeAll();
                    });
                });
            } else {
                layer.onVisibleChange(function() {
                    PopupsService.closeAll();
                });
            }
            return true;
        };
        Layers.prototype.removeOverlayLayer = function(layer) {
            var self = this;
            if(self.overlayLayers.indexOf(layer) === -1) {
                return false;
            }
            var layers = [layer];
            if(layer instanceof anol.layer.Group) {
                layers = layer.layers;
                if(layer.name !== undefined) {
                    delete self.nameGroupsMap[layer.name];
                }
            }


            angular.forEach(layers, function(_layer) {
                var addedLayersIdx = self.addedLayers.indexOf(_layer);
                if(addedLayersIdx > -1) {
                    self.addedLayers.splice(addedLayersIdx, 1);
                }

                var overlayLayerIdx = self.overlayLayers.indexOf(_layer);
                if(overlayLayerIdx > -1) {
                    self.overlayLayers.splice(overlayLayerIdx, 1);
                }

                if(self.map !== undefined) {
                    var olLayerIdx = self.olLayers.indexOf(_layer.olLayer);
                    if(olLayerIdx > -1) {
                        self.map.removeLayer(_layer.olLayer);
                        self.olLayers.splice(olLayerIdx, 1);
                    }
                }
                angular.forEach(self.removeLayerHandlers, function(handler) {
                    handler(_layer);
                });
                _layer.removeOlLayer();
            });
        };
        /**
         * @ngdoc method
         * @name addSystemLayer
         * @methodOf anol.map.LayersService
         * @param {anol.layer} layer Overlay layer to add
         * @param {number} idx Position to add overlay layer at
         * @description
         * Adds a system layer. System layers should only created and added by
         * anol components
         */
        Layers.prototype.addSystemLayer = function(layer, idx) {
            var self = this;
            idx = idx || 0;
            self.systemLayers.splice(idx, 0, layer);
        };
        /**
         * private function
         * Creates olLayer
         */
        Layers.prototype.createOlLayer = function(layer) {
            var olSource;
            var lastAddedLayer = this.lastAddedLayer();
            if(lastAddedLayer !== undefined && lastAddedLayer.isCombinable(layer)) {
                olSource = lastAddedLayer.getCombinedSource(layer);
                if(layer instanceof anol.layer.DynamicGeoJSON && layer.isClustered()) {
                    layer.unclusteredSource = lastAddedLayer.unclusteredSource;
                }
                layer.combined = true;
            }
            if(olSource === undefined) {
                var sourceOptions = angular.extend({}, layer.olSourceOptions);
                if(layer.isClustered()) {
                    sourceOptions.distance = this.clusterDistance;
                }
                olSource = new layer.OL_SOURCE_CLASS(sourceOptions);
                olSource.set('anolLayers', [layer]);
            }
            var layerOpts = angular.extend({}, layer.olLayerOptions);
            layerOpts.source = olSource;
            var olLayer = new layer.OL_LAYER_CLASS(layerOpts);
            // only instances of BaseWMS are allowed to share olLayers
            // TODO allow also DynamicGeoJSON layer to share olLayers
            if(layer.combined && layer instanceof anol.layer.BaseWMS &&
               angular.equals(layer.olLayerOptions,lastAddedLayer.olLayerOptions)
            ) {
                layer.setOlLayer(lastAddedLayer.olLayer);
                // TODO add layer to anolLayers of lastAddedLayer when anolLayer refactored anolLayers
                return lastAddedLayer.olLayer;
            }
            // TODO refactor to anolLayers with list of layers
            // HINT olLayer.anolLayer is used in featurepopup-, geocoder- and geolocation-directive
            //      this will only affacts DynamicGeoJsonLayer
            olLayer.set('anolLayer', layer);
            layer.setOlLayer(olLayer);
            return olLayer;
        };
        /**
         * private function
         * Adds layer to internal lists, executes addLayer handlers and calls _addLayer
         */
        Layers.prototype._prepareLayer = function(layer) {
            var self = this;

            var layers = [layer];
            if(layer instanceof anol.layer.Group) {
                if(layer.name !== undefined) {
                    self.nameGroupsMap[layer.name] = layer;
                }
                layers = layer.layers;
            }

            angular.forEach(layers, function(_layer) {
                if(_layer.name !== undefined) {
                    self.nameLayersMap[_layer.name] = _layer;
                }
            });

            angular.forEach(layers, function(_layer) {
                self.createOlLayer(_layer);
                self.addedLayers.push(_layer);
                // if (_layer.options !== undefined && _layer.options.visible) {
                //     _layer.setVisible(true);
                // }
                angular.forEach(self.addLayerHandlers, function(handler) {
                    handler(_layer);
                });
            });

            // while map is undefined, don't add layers to it
            // when map is created, all this.layers are added to map
            // after that, this.map is registered
            // so, when map is defined, added layers are not in map
            // and must be added
            if(self.map !== undefined) {
                if(layer instanceof anol.layer.Group) {
                    angular.forEach(layer.layers, function(_layer, idx) {
                        if(self.olLayers.indexOf(_layer.olLayer) < 0) {
                            self._addLayer(_layer, false);
                        }
                    });
                } else {
                    if(self.olLayers.indexOf(layer.olLayer) < 0) {
                        self._addLayer(layer, false);
                    }
                }
            }
        };
        /**
         * private function
         * Add layer to map and execute postAddToMap function of layer
         */
        Layers.prototype._addLayer = function(layer, skipLayerIndex) {
            this.map.addLayer(layer.olLayer);
            layer.map = this.map;

            if(skipLayerIndex !== true) {
                this.olLayers.push(layer.olLayer);
            }
        };
        /**
         * @ngdoc method
         * @name layers
         * @methodOf anol.map.LayersService
         * @returns {array.<anol.layer.Layer>} All layers, including groups
         * @description
         * Get all layers managed by layers service
         */
        Layers.prototype.layers = function() {
            var self = this;
            return self.backgroundLayers.concat(self.overlayLayers);
        };
        /**
         * @ngdoc method
         * @name flattedLayers
         * @methodOf anol.map.LayersService
         * @returns {Array.<anol.layer.Layer>} flattedLayers
         * @description
         * Returns all layers except groups. Grouped layers extracted from their gropus.
         */
        Layers.prototype.flattedLayers = function() {
            var self = this;
            var flattedLayers = [];
            angular.forEach(self.layers(), function(layer) {
                if(layer instanceof anol.layer.Group) {
                    flattedLayers = flattedLayers.concat(layer.layers);
                } else {
                    flattedLayers.push(layer);
                }
            });
            return flattedLayers;
        };
        /**
         * @ngdoc method
         * @name activeBbackgroundLayer
         * @methodOf anol.map.LayersService
         * @returns {anol.layer.Layer} backgroundLayer visible background layer
         * @description
         * Returns the visible background layer
         */
        Layers.prototype.activeBackgroundLayer = function() {
            var self = this;
            var backgroundLayer;
            angular.forEach(self.backgroundLayers, function(layer) {
                if(layer.getVisible() === true) {
                    backgroundLayer = layer;
                }
            });
            return backgroundLayer;
        };
        /**
         * @ngdoc method
         * @name layerByName
         * @methodOf anol.map.LayersService
         * @param {string} name
         * @returns {anol.layer.Layer} layer
         * @description Gets a layer by it's name
         */
        Layers.prototype.layerByName = function(name) {
            return this.nameLayersMap[name];
        };
        /**
         * @ngdoc method
         * @name groupByName
         * @methodOf anol.map.LayersService
         * @param {string} name
         * @returns {anol.layer.Group} group
         * @description Gets a group by it's name
         */
        Layers.prototype.groupByName = function(name) {
            return this.nameGroupsMap[name];
        };
        Layers.prototype.reorderGroupLayers = function() {
            var lastOlLayerUid = undefined;
            var self = this;
            self.zIndex = 0;
            self.overlayLayers.slice().reverse().forEach(function(layer) {
                if(layer instanceof anol.layer.Group) {
                    layer.layers.slice().reverse().forEach(function(grouppedLayer, idx) {
                        if (lastOlLayerUid !== grouppedLayer.olLayer.ol_uid) {
                            grouppedLayer.olLayer.setZIndex(self.zIndex);
                            self.zIndex = self.zIndex + 1;
                        }
                        lastOlLayerUid = grouppedLayer.olLayer.ol_uid;
                    });
                }
            });     
        };        
        Layers.prototype.reorderOverlayLayers = function() {
            var lastOlLayerUid = undefined;
            var self = this;
            self.zIndex = 0;
            self.overlayLayers.slice().reverse().forEach(function(layer) {
                if(layer instanceof anol.layer.Group) {
                    layer.layers.slice().reverse().forEach(function(grouppedLayer, idx) {
                        if(grouppedLayer.combined) {
                            grouppedLayer.reOrderLayerParams(layer.layers);
                        }
                        if (lastOlLayerUid !== grouppedLayer.olLayer.ol_uid) {
                            grouppedLayer.olLayer.setZIndex(self.zIndex);
                            self.zIndex = self.zIndex + 1;
                        }
                        lastOlLayerUid = grouppedLayer.olLayer.ol_uid;
                    });
                }
            });                        
        };        
        Layers.prototype.lastAddedLayer = function() {
            var idx = this.addedLayers.length - 1;
            if(idx > -1) {
                return this.addedLayers[idx];
            }
        };
        Layers.prototype.registerRemoveLayerHandler = function(handler) {
            this.removeLayerHandlers.push(handler);
        };
        Layers.prototype.registerAddLayerHandler = function(handler) {
            this.addLayerHandlers.push(handler);
        };
        return new Layers(_layers, _addLayerHandlers, _removeLayerHandlers, _clusterDistance);
    }];
}]);
