import { defaults } from './module.js';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';

angular.module('anol.urlmarkers')
/**
 * @ngdoc object
 * @name anol.urlmarkers.UrlMarkersServiceProvider
 */
.provider('UrlMarkersService', [function() {
    var _defaultSrs;
    var _propertiesDelimiter = '|';
    var _keyValueDelimiter = ':';
    var _style = {};
    var _usePopup = true;
    var _popupOffset = [0, 0];

    /**
     * @ngdoc method
     * @name setDefaultSrs
     * @methodOf anol.urlmarkers.UrlMarkersServiceProvider
     * @param {string} srs default EPSG code of marker coordinates in url
     */
    this.setDefaultSrs = function(srs) {
        _defaultSrs = srs;
    };

    /**
     * @ngdoc method
     * @name setPropertiesDelimiter
     * @methodOf anol.urlmarkers.UrlMarkersServiceProvider
     * @param {string} delimiter Delimiter separating marker properties
     */
    this.setPropertiesDelimiter = function(delimiter) {
        _propertiesDelimiter = delimiter || _propertiesDelimiter;
    };

    /**
     * @ngdoc method
     * @name setKeyValueDelimiter
     * @methodOf anol.urlmarkers.UrlMarkersServiceProvider
     * @param {string} delimiter Delimiter separating properties keys from values
     */
    this.setKeyValueDelimiter = function(delimiter) {
        _keyValueDelimiter = delimiter || _keyValueDelimiter;
    };

    /**
     * @ngdoc method
     * @name setMarkerStyle
     * @methodOf anol.urlmarkers.UrlMarkersServiceProvider
     * @param {object} style marker style
     */
    this.setMarkerStyle = function(style) {
        _style = style;
    };

    /**
     * @ngdoc method
     * @name setPopup
     * @methodOf anol.urlmarkers.UrlMarkersServiceProvider
     * @param {boolean} usePopup
     * @description When not using popup a label text is added. This can be styled by markerStyle
     */
    this.setUsePopup = function(usePopup) {
        _usePopup = usePopup === undefined ? _usePopup : usePopup;
    };

    /**
     * @ngdoc method
     * @name setPopupOffset
     * @methodOf anol.urlmarkers.UrlMarkersServiceProvider
     * @param {Array.<number>} popupOffset Offset of placed popup. First value is x- second value is y-offset in px
     */
    this.setPopupOffset = function(popupOffset) {
        _popupOffset = popupOffset === undefined ? _popupOffset : popupOffset;
    };

    this.$get = ['$location', 'MapService', 'LayersService', function($location, MapService, LayersService) {
        /**
         * @ngdoc service
         * @name anol.urlmarkers.UrlMarkersService
         *
         * @description
         * Adds markers specified in url. A valid url marker looks like marker=color:ff0000|label:foobar|coord:8.21,53.15|srs:4326
         */
        var UrlMarkers = function(defaultSrs, propertiesDelimiter, keyValueDelimiter, style, usePopup, popupOffset) {
            var self = this;
            self.features = [];
            self.defaultSrs = defaultSrs || MapService.view.getProjection();
            self.propertiesDelimiter = propertiesDelimiter;
            self.keyValueDelimiter = keyValueDelimiter;
            self.style = style;
            self.usePopup = usePopup;
            self.popupOffset = popupOffset;

            self.extractFeaturesFromUrl();

            if(self.features.length === 0) {
                return;
            }

            self.layer = self.createLayer(self.features);

            LayersService.addSystemLayer(self.layer);
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
                        marker.geometry = new Point(coord);
                    } else if (kv[0] === 'srs') {
                        marker.srs = 'EPSG:' + kv[1];
                    } else if (kv[0] === 'color') {
                        style = {
                            fillColor: '#' + kv[1],
                            strokeColor: '#' + kv[1],
                            graphicColor: '#' + kv[1]
                        };
                    } else {
                        marker[kv[0]] = kv[1];
                    }
                });
                if(marker.geometry === undefined) {
                    return;
                }
                marker.geometry.transform(
                    marker.srs || self.defaultSrs,
                    MapService.view.getProjection().getCode()
                );
                marker.style = angular.merge({}, self.style, style);
                if(!self.usePopup && marker.label !== undefined) {
                    marker.style.text = marker.label;
                }
                self.features.push(new Feature(marker));

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

        return new UrlMarkers(_defaultSrs, _propertiesDelimiter, _keyValueDelimiter, _style, _usePopup, _popupOffset);
    }];
}]);
