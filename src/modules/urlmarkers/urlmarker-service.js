angular.module('anol.urlmarkers')

.provider('UrlMarkersService', [function() {
    var _defaultSrs;
    var _propertiesDelimiter = '|';
    var _keyValueDelimiter = ':';
    var _style = {};
    var _usePopup = true;

    this.setDefaultSrs = function(srs) {
        _defaultSrs = srs;
    };

    this.setPropertiesDelimiter = function(delimiter) {
        _propertiesDelimiter = delimiter;
    };

    this.setKeyValueDelimiter = function(delimiter) {
        _keyValueDelimiter = delimiter || _keyValueDelimiter;
    };

    this.setMarkerStyle = function(style) {
        _style = style;
    };

    this.setUsePopup = function(usePopup) {
        _usePopup = usePopup;
    };

    this.$get = ['$rootScope', '$location', '$compile', '$document', 'MapService', 'LayersService', function($rootScope, $location, $compile, $document, MapService, LayersService) {
        var UrlMarkers = function(defaultSrs, propertiesDelimiter, keyValueDelimiter, style, usePopup) {
            var self = this;
            self.features = [];
            self.defaultSrs = defaultSrs || MapService.view.getProjection();
            self.propertiesDelimiter = propertiesDelimiter;
            self.keyValueDelimiter = keyValueDelimiter;
            self.style = style;
            self.usePopup = usePopup;

            self.extractFeaturesFromUrl();

            if(self.features.length === 0) {
                return;
            }

            self.layer = self.createLayer(self.features);

            LayersService.addSystemLayer(self.layer);

            if(self.usePopup) {
                self.overlays = self.createPopups(self.features);
            }
        };

        UrlMarkers.prototype.extractFeaturesFromUrl = function() {
            var self = this;
            var urlParams = $location.search();

            if(angular.isUndefined(urlParams.marker)) {
                return false;
            }

            var markers = angular.isArray(urlParams.marker) ? urlParams.marker : [urlParams.marker];
            angular.forEach(markers, function(_marker) {
                var params = _marker.split(self.propertiesDelimiter);
                if(params.length === 0) {
                    return;
                }

                var marker = {};
                var style = {};
                angular.forEach(params, function(kv) {
                    kv = kv.split(self.keyValueDelimiter);
                    if(kv[0] === 'coord') {
                        var coord = kv[1].split(',');
                        coord = [parseFloat(coord[0]), parseFloat(coord[1])];
                        marker.geometry = new ol.geom.Point(coord);
                    } else if (kv[0] === 'srs') {
                        marker.srs = 'EPSG:' + kv[1];
                    } else if (kv[0] === 'color') {
                        style = {
                            fillColor: '#' + kv[1],
                            strokeColor: '#' + kv[1],
                            graphicColor: '#' + kv[1]
                        };
                    }
                    else {
                        marker[kv[0]] = kv[1];
                    }
                });
                if(marker.geometry === undefined) {
                    return;
                }
                marker.geometry.transform(
                    marker.srs || self.defaultSrs,
                    MapService.view.getProjection()
                );
                marker.style = angular.merge({}, self.style, style);
                if(!self.usePopup && marker.label !== undefined) {
                    marker.style.text = marker.label;
                }
                self.features.push(new ol.Feature(marker));

            });
        };

        UrlMarkers.prototype.createLayer = function(features) {
            var layer = new anol.layer.Feature({
                name: 'markersLayer',
                olLayer: {
                    source: {
                        features: features
                  }
                }
            });

            var olLayerOptions = layer.olLayerOptions;
            olLayerOptions.source = new layer.OL_SOURCE_CLASS(layer.olSourceOptions);
            layer.setOlLayer(new layer.OL_LAYER_CLASS(olLayerOptions));

            return layer;
        };

        UrlMarkers.prototype.createPopups = function(features)  {
            var self = this;
            angular.forEach(features, function(feature) {
                var label = feature.get('label');
                if(label === undefined) {
                    return;
                }
                var coordinate = feature.getGeometry().getCoordinates();
                if(coordinate === undefined) {
                    return;
                }
                var template = '<div anol-feature-popup coordinate="coordinate" layers="layers" open sticky>{{ label }}</div>';
                var compiled = $compile(angular.element(template));
                var popupScope = $rootScope.$new();
                popupScope.coordinate = coordinate;
                popupScope.label = label;
                popupScope.layers = [self.layer];
                $document.find('body').append(compiled(popupScope));
            });

        };

        return new UrlMarkers(_defaultSrs, _propertiesDelimiter, _keyValueDelimiter, _style, _usePopup);
    }];
}]);
