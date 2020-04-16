import './module.js';
import { transform } from 'ol/proj';

angular.module('anol.permalink')

/**
 * @ngdoc object
 * @name anol.permalink.PermalinkServiceProvider
 */
    .provider('PermalinkService', [function() {
        var _urlCrs;
        var _precision = 100000;

        var getParamString = function(param, params) {
            if(angular.isUndefined(params[param])) {
                return false;
            }
            var p = params[param];
            if(angular.isArray(p)) {
                p = p[p.length -1];
            }
            return p;
        };

        var extractMapParams = function(params) {
            var mapParam = getParamString('map', params);
            var mapParams;
            if(mapParam === false) {
                mapParams = null;
            } else {
                mapParams = mapParam.split(',');
            }

            var layersParam = getParamString('layers', params);
            var layers;
            if(layersParam !== false) {
                layers = layersParam.split(',');
            }

            var visibleCatalogLayersParam = getParamString('visibleCatalogLayers', params);
            var visibleCatalogLayers;
            if(visibleCatalogLayersParam !== false) {
                visibleCatalogLayers = visibleCatalogLayersParam.split(',');
            }

            var catalogLayersParam = getParamString('catalogLayers', params);
            var catalogLayers;
            if(catalogLayersParam !== false) {
                catalogLayers = catalogLayersParam.split(',');
            }

            var visibleCatalogGroupsParam = getParamString('visibleCatalogGroups', params);
            var visibleCatalogGroups;
            if(visibleCatalogGroupsParam !== false) {
                visibleCatalogGroups = visibleCatalogGroupsParam.split(',');
            }

            var catalogGroupsParam = getParamString('catalogGroups', params);
            var catalogGroups;
            if(catalogGroupsParam !== false) {
                catalogGroups = catalogGroupsParam.split(',');
            }
            
            var result = {}
            if(mapParams !== null && mapParams.length == 4) {
                result = {
                    'zoom': parseInt(mapParams[0]),
                    'center': [parseFloat(mapParams[1]), parseFloat(mapParams[2])],
                    'crs': mapParams[3]
                };
            }
            if(angular.isDefined(layers)) {
                result.layers = layers;
            }

            if(angular.isDefined(catalogLayers)) {
               result.catalogLayers = catalogLayers;
            }

            if(angular.isDefined(visibleCatalogLayers)) {
                result.visibleCatalogLayers = visibleCatalogLayers;
            }

            if(angular.isDefined(catalogGroups)) {
                result.catalogGroups = catalogGroups;
            }
 
            if(angular.isDefined(visibleCatalogGroups)) {
                result.visibleCatalogGroups = visibleCatalogGroups;
            }

            return result;
        };

        /**
     * @ngdoc method
     * @name setUrlCrs
     * @methodOf anol.permalink.PermalinkServiceProvider
     * @param {string} crs EPSG code of coordinates in url
     * @description
     * Define crs of coordinates in url
     */
        this.setUrlCrs = function(crs) {
            _urlCrs = crs;
        };

        /**
     * @ngdoc method
     * @name setPrecision
     * @methodOf anol.permalink.PermalinkServiceProvider
     * @param {number} precision Precision of coordinates in url
     * @description
     * Define precision of coordinates in url
     */
        this.setPrecision = function(precision) {
            _precision = precision;
        };

        this.$get = ['$rootScope', '$location', 'MapService', 'LayersService', 'CatalogService', 
            function($rootScope, $location, MapService, LayersService, CatalogService) {
                /**
         * @ngdoc service
         * @name anol.permalink.PermalinkService
         *
         * @requires $rootScope
         * @requires $location
         * @requires anol.map.MapService
         * @requires anol.map.LayersService
         *
         * @description
         * Looks for a `map`-parameter in current url and move map to location specified in
         *
         * Updates browser-url with current zoom and location when map moved
         */
                var Permalink = function(urlCrs, precision) {
                    var self = this;
                    self.precision = precision;
                    self.zoom = undefined;
                    self.lon = undefined;
                    self.lat = undefined;
                    self.map = MapService.getMap();
                    self.view = self.map.getView();
                    self.visibleLayerNames = [];
                    self.visibleCatalogLayerNames = [];
                    self.catalogLayerNames = [];

                    self.urlCrs = urlCrs;
                    if (angular.isUndefined(self.urlCrs)) {
                        var projection = self.view.getProjection();
                        self.urlCrs = projection.getCode();
                    }

                    var params = $location.search();
                    var mapParams = extractMapParams(params);
                    if(mapParams !== false) {
                        self.updateMapFromParameters(mapParams);
                    } else {
                        angular.forEach(LayersService.flattedLayers(), function(layer) {
                            if(layer.permalink === true) {
                                if(layer.getVisible()) {
                                    self.visibleLayerNames.push(layer.name);
                                }
                            }
                        });
                    }
                    self.map.on('moveend', function() {
                        self.moveendHandler();
                    }.bind(self));

                    $rootScope.$watchCollection(function() {
                        return LayersService.layers();
                    }, function(newVal) {
                        if(angular.isDefined(newVal)) {
                            angular.forEach(newVal, function(layer) {
                                if (angular.isUndefined(layer)) {
                                    return true;
                                }
                                
                                if(layer instanceof anol.layer.Group) {
                                    angular.forEach(layer.layers, function(groupLayer) {
                                        if(groupLayer.permalink === true) {
                                            groupLayer.offVisibleChange(self.handleVisibleChange);
                                            groupLayer.onVisibleChange(self.handleVisibleChange, self);
                                        }
                                    });
                                } else {
                                    if(layer.permalink === true) {
                                        layer.offVisibleChange(self.handleVisibleChange);
                                        layer.onVisibleChange(self.handleVisibleChange, self);
                                    }
                                }
                            });
                        }
                    });

                    $rootScope.$watchCollection(function() {
                        return CatalogService.addedCatalogGroups();
                    }, function(newVal) {
                        if(angular.isDefined(newVal)) {
                            self.catalogGroupNames = [];
                            self.visibleCatalogGroupNames = [];
                            self.visibleCatalogLayerNames = [];
                            angular.forEach(newVal, function(group) {
                                group.offVisibleChange(self.handleVisibleChange);
                                group.onVisibleChange(self.handleVisibleChange, self);
                                    angular.forEach(group.layers, function(layer) {
                                        layer.offVisibleChange(self.handleVisibleChange);
                                        layer.onVisibleChange(self.handleVisibleChange, self);
                                        if (layer.getVisible() ) {
                                            self.visibleCatalogLayerNames.push(layer.name);
                                        }
                                    });
                                
                                self.catalogGroupNames.push(group.name);
                                if (group.getVisible()) {
                                    self.visibleCatalogGroupNames.push(group.name);
                                }
                            });
                            self.generatePermalink();
                        }
                    });

                    $rootScope.$watchCollection(function() {
                        return CatalogService.addedCatalogLayers();
                    }, function(newVal) {
                        if(angular.isDefined(newVal)) {
                            self.catalogLayerNames = [];
                            self.visibleCatalogLayerNames = [];
                            angular.forEach(newVal, function(layer) {
                                layer.offVisibleChange(self.handleVisibleChange);
                                layer.onVisibleChange(self.handleVisibleChange, self);
                                self.catalogLayerNames.push(layer.name);
                                if (layer.getVisible()) {
                                    self.visibleCatalogLayerNames.push(layer.name);
                                }
                            });
                            self.generatePermalink();
                        }
                    });
                };
                
                /**
                 * @private
                 */
                Permalink.prototype.handleVisibleChange = function(evt) {
                    var self = evt.data.context;
                    // this in this context is the layer, visiblie changed for
                    var layer = this;
                    var layerName = layer.name;
                    if(layer.permalink === true) {
                        if(angular.isDefined(layerName) && layer.getVisible()) {
                            self.visibleLayerNames.push(layerName);
                        } else {
                            var layerNameIdx = $.inArray(layerName, self.visibleLayerNames);
                            if(layerNameIdx > -1) {
                                self.visibleLayerNames.splice(layerNameIdx, 1);
                            }
                        }
                        self.generatePermalink();
                    }
                    if (layer.catalogLayer === true) {
                        if(layer instanceof anol.layer.Group || (layer.hasGroup() && layer.anolGroup.layers.length == 1)) {
                            if (typeof layer.hasGroup == 'function' && layer.hasGroup()) {
                                layerName = layer.anolGroup.name;
                            }
                            
                            if(angular.isDefined(layerName) && layer.getVisible()) {
                                self.visibleCatalogGroupNames.push(layerName);
                            } else {
                                var layerNameIdx = $.inArray(layerName, self.visibleCatalogGroupNames);
                                if(layerNameIdx > -1) {
                                    self.visibleCatalogGroupNames.splice(layerNameIdx, 1);
                                }
                            }
                        } else {
                            
                            if(angular.isDefined(layerName) && layer.getVisible()) {
                                self.visibleCatalogLayerNames.push(layerName);
                            } else {
                                var layerNameIdx = $.inArray(layerName, self.visibleCatalogLayerNames);
                                if(layerNameIdx > -1) {
                                    self.visibleCatalogLayerNames.splice(layerNameIdx, 1);
                                }
                            }
                        }
                        self.generatePermalink();
                    }
                };
                /**
                 * @private
                 * @name moveendHandler
                 * @methodOf anol.permalink.PermalinkService
                 * @param {Object} evt ol3 event object
                 * @description
                 * Get lat, lon and zoom after map stoped moving
                 */
                Permalink.prototype.moveendHandler = function() {
                    var self = this;
                    var center = transform(self.view.getCenter(), self.view.getProjection().getCode(), self.urlCrs);
                    self.lon = Math.round(center[0] * self.precision) / self.precision;
                    self.lat = Math.round(center[1] * self.precision) / self.precision;

                    self.zoom = self.view.getZoom();
                    $rootScope.$apply(function() {
                        self.generatePermalink();
                    });
                };
                /**
                 * @private
                 * @name generatePermalink
                 * @methodOf anol.permalink.PermalinkService
                 * @param {Object} evt ol3 event object
                 * @description
                 * Builds the permalink url addon
                 */
                Permalink.prototype.generatePermalink = function() {
                    var self = this;
                    if(angular.isUndefined(self.zoom) || angular.isUndefined(self.lon) || angular.isUndefined(self.lat)) {
                        return;
                    }

                    self.visibleLayerNames = anol.helper.uniq(self.visibleLayerNames);
                    $location.search('map', [self.zoom, self.lon, self.lat, self.urlCrs].join(','));
                    $location.search('layers', self.visibleLayerNames.join(','));
                    if (self.visibleCatalogLayerNames.length !== 0) {
                        $location.search('visibleCatalogLayers', self.visibleCatalogLayerNames.join(','));
                    } else {
                        $location.search('visibleCatalogLayers', null);
                    }

                    if (self.catalogLayerNames.length !== 0) {
                        $location.search('catalogLayers', self.catalogLayerNames.join(','));
                    } else {
                        $location.search('catalogLayers', null);
                    }

                    if (self.visibleCatalogGroupNames.length !== 0) {
                        $location.search('visibleCatalogGroups', self.visibleCatalogGroupNames.join(','));
                    } else {
                        $location.search('visibleCatalogGroups', null);
                    }

                    if (self.catalogGroupNames.length !== 0) {
                        $location.search('catalogGroups', self.catalogGroupNames.join(','));
                    } else {
                        $location.search('catalogGroups', null);
                    }
                    $location.replace();
                };

                Permalink.prototype.updateMapFromParameters = function(mapParams) {
                    var self = this;
                    if(mapParams.center !== undefined) {
                        var center = transform(mapParams.center, mapParams.crs, self.view.getProjection().getCode());
                        self.view.setCenter(center);
                        self.view.setZoom(mapParams.zoom);
                    }

                    if(mapParams.layers !== undefined) {
                        // remove duplicate from visible Layers
                        self.visibleLayerNames = anol.helper.uniq(mapParams.layers);
                        var backgroundLayerAdded = false;
                        angular.forEach(LayersService.layers(), function(layer) {
                            // only overlay layers are grouped
                            if(layer instanceof anol.layer.Group) {
                                angular.forEach(layer.layers, function(groupLayer) {
                                    if(groupLayer.permalink !== true) {
                                        return;
                                    }
                                    var visible = mapParams.layers.indexOf(groupLayer.name) !== -1;
                                    groupLayer.setVisible(visible);
                                });
                            } else {
                                if(layer.permalink !== true) {
                                    return;
                                }
                                var visible = mapParams.layers.indexOf(layer.name) > -1;

                                if(layer.isBackground && visible) {
                                    if(!backgroundLayerAdded) {
                                        backgroundLayerAdded = true;
                                    } else {
                                        visible = false;
                                    }
                                }
                                layer.setVisible(visible);
                            }
                        });
                    }

                    if (mapParams.catalogLayers !== undefined) {
                        angular.forEach(mapParams.catalogLayers, function(layerName) {
                            var visible = false;
                            if (mapParams.visibleCatalogLayers) {
                                visible = mapParams.visibleCatalogLayers.indexOf(layerName) > -1;
                            }              
                            CatalogService.addToMap(layerName, visible);
                        });
                    }
                    
                    if (mapParams.catalogGroups !== undefined) {
                        angular.forEach(mapParams.catalogGroups, function(groupName) {
                            var visible = false;
                            if (mapParams.visibleCatalogGroups) {
                                visible = mapParams.visibleCatalogGroups.indexOf(groupName) > -1;
                            } 
                            var group = CatalogService.addGroupToMap(groupName, visible);
                            group.then(function(group) {
                                if (group.layers.length > 1) {
                                    angular.forEach(group.layers, function(layer){
                                        if (mapParams.visibleCatalogLayers) {
                                            var visibleLayer = mapParams.visibleCatalogLayers.indexOf(layer.name) > -1;
                                            layer.setVisible(visibleLayer);
                                        }
                                    })
                                }
                            });
                        });
                    }
                };

                Permalink.prototype.getSettings = function() {
                    var self = this;
                    var sidebarStatus = $location.search().sidebarStatus;
                    var sidebar = $location.search().sidebar;
                    return {
                        zoom: self.zoom,
                        center: [self.lon, self.lat],
                        crs: self.urlCrs,
                        layers: self.visibleLayerNames,
                        catalogLayers: self.catalogLayerNames,
                        visibleCatalogLayers: self.visibleCatalogLayerNames,
                        catalogGroups: self.catalogGroupNames,
                        visibleCatalogGroups: self.visibleCatalogGroupNames,
                        sidebar: sidebar,
                        sidebarStatus: sidebarStatus
                    };
                };

                Permalink.prototype.getPermalinkParameters = function() {
                    var self = this;
                    return {
                        zoom: self.zoom,
                        center: [self.lon, self.lat],
                        crs: self.urlCrs,
                        layers: self.visibleLayerNames
                    };
                };

                Permalink.prototype.setPermalinkParameters = function(params) {
                    var self = this;
                    self.updateMapFromParameters(params);
                };
        
                return new Permalink(_urlCrs, _precision);
            }];
    }]);
