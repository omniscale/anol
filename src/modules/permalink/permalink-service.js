angular.module('anol.permalink')

/**
 * @ngdoc object
 * @name anol.permalink.PermalinkServiceProvider
 */
.provider('PermalinkService', [function() {
    var _urlCrs;
    var _precision = 100000;
    var extractMapParams = function(params) {
        if(angular.isUndefined(params.map)) {
            return false;
        }
        var layers = angular.isUndefined(params.layers) ? false : params.layers.split(',');
        var mapParams = params.map.split(',');
        if(mapParams !== null && mapParams.length == 4) {
            return {
                'zoom': parseInt(mapParams[0]),
                'center': [parseFloat(mapParams[1]), parseFloat(mapParams[2])],
                'crs': mapParams[3],
                'layers': layers
            };
        }
        return false;
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

    this.$get = ['$rootScope', '$location', 'MapService', 'LayersService', function($rootScope, $location, MapService, LayersService) {
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

            self.urlCrs = urlCrs;
            if (self.urlCrs === undefined) {
                var projection = self.view.getProjection();
                self.urlCrs = projection.getCode();
            }

            var params = $location.search();
            var mapParams = extractMapParams(params);
            if(mapParams !== false) {
                var center = ol.proj.transform(mapParams.center, mapParams.crs, self.view.getProjection());
                self.view.setCenter(center);
                self.view.setZoom(mapParams.zoom);
                if(mapParams.layers !== false) {
                    self.visibleLayerNames = mapParams.layers;
                    var backgroundLayerAdded = false;
                    angular.forEach(LayersService.layers, function(layer) {
                        // only overlay layers are grouped
                        if(layer instanceof anol.layer.Group) {
                            angular.forEach(layer.layers, function(groupLayer) {
                                groupLayer.setVisible(mapParams.layers.indexOf(groupLayer.name) !== -1);
                            });
                        } else {
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
            } else {
                angular.forEach(LayersService.flattedLayers, function(layer) {
                    if(layer.getVisible()) {
                        self.visibleLayerNames.push(layer.name);
                    }
                });
            }

            self.map.on('moveend', self.moveendHandler, self);

            $rootScope.$watchCollection(function() {
                return LayersService.layers;
            }, function(newVal) {
                if(angular.isDefined(newVal)) {
                    angular.forEach(newVal, function(layer) {
                        if(layer instanceof anol.layer.Group) {
                            angular.forEach(layer.layers, function(groupLayer) {
                                groupLayer.olLayer.on('change:visible', function(evt) {
                                    self.handleVisibleChange(evt);
                                });
                            });
                        } else {
                            layer.olLayer.on('change:visible', function(evt) {
                                self.handleVisibleChange(evt);
                            });
                        }
                    });
                }
            });
        };
        /**
         * @private
         */
        Permalink.prototype.handleVisibleChange = function(evt) {
            var self = this;
            var layer = evt.target;
            var layerName = layer.get('anolLayer').name;
            if(angular.isDefined(layerName) && layer.getVisible()) {
                self.visibleLayerNames.push(layerName);
            } else {
                var layerNameIdx = $.inArray(layerName, self.visibleLayerNames);
                if(layerNameIdx > -1) {
                    self.visibleLayerNames.splice(layerNameIdx, 1);
                }
            }
            self.generatePermalink();
        };
        /**
         * @private
         * @name moveendHandler
         * @methodOf anol.permalink.PermalinkService
         * @param {Object} evt ol3 event object
         * @description
         * Get lat, lon and zoom after map stoped moving
         */
        Permalink.prototype.moveendHandler = function(evt) {
            var self = this;
            var center = ol.proj.transform(self.view.getCenter(), self.view.getProjection(), self.urlCrs);
            self.lon = Math.round(center[0] * this.precision) / this.precision;
            self.lat = Math.round(center[1] * this.precision) / this.precision;

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
        Permalink.prototype.generatePermalink = function(evt) {
            var self = this;
            if(self.zoom === undefined || self.lon === undefined || self.lat === undefined) {
                return;
            }
            $location.search('map', [self.zoom, self.lon, self.lat, self.urlCrs].join(','));
            $location.search('layers', self.visibleLayerNames.join(','));
        };
        return new Permalink(_urlCrs, _precision);
    }];
}]);
