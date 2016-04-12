/**
 * @ngdoc object
 * @name anol.layer.DynamicGeoJSON
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 * @param {string} options.olLayer.source.url Url for requesting a GeoJSON
 * @param {string} options.olLayer.source.featureProjection Projection of received GeoJSON
 * @param {Object} options.olLayer.source.additionalParameters Additional parameters added to request
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.StaticGeoJSON}.
 *
 * Ask *url* with current projection and bbox.
 */
anol.layer.DynamicGeoJSON = function(_options) {
    anol.layer.StaticGeoJSON.call(this, _options);
};
anol.layer.DynamicGeoJSON.prototype = new anol.layer.StaticGeoJSON(false);
$.extend(anol.layer.DynamicGeoJSON.prototype, {
    CLASS_NAME: 'anol.layer.DynamicGeoJSON',
    setOlLayer: function(olLayer) {
        anol.layer.StaticGeoJSON.prototype.setOlLayer.call(this, olLayer);
        this.olSource = olLayer.getSource();
    },
    isCombinable: function(other) {
        if(other.CLASS_NAME !== this.CLASS_NAME) {
            return false;
        }
        if(this.olSourceOptions.url !== other.olSourceOptions.url) {
            return false;
        }
        if(this.olSourceOptions.featureProjection !== other.olSourceOptions.featureProjection) {
            return false;
        }
        return true;
    },
    getCombinedSource: function(other) {
        var anolLayers = this.olSource.get('anolLayers');
        anolLayers.push(other);
        this.olSource.set('anolLayers', anolLayers);
        return this.olSource;
    },
    setVisible: function(visible) {
        anol.layer.StaticGeoJSON.prototype.setVisible.call(this, visible);
        // find better solution than clear, cause it's remove all features from the source, not only
        // features related to current layer. But we need to call clear, otherwise source extent is not
        // resetted and it will not be reloaded with updated url params
        this.olSource.clear(true);
    },
    /**
     * Additional source options
     * - url
     * - featureProjection
     * - additionalParameters
     */
    _createSourceOptions: function(srcOptions) {
        var self = this;
        srcOptions = anol.layer.StaticGeoJSON.prototype._createSourceOptions.call(this,
            srcOptions
        );

        srcOptions.format = new ol.format.GeoJSON();
        srcOptions.strategy = ol.loadingstrategy.bbox;

        srcOptions.loader = function(extent, resolution, projection) {
            var additionalParameters = {};
            angular.forEach(self.olSource.get('anolLayers'), function(layer) {
                if(layer.getVisible()) {
                    additionalParameters = anol.helper.mergeObjects(additionalParameters, layer.olSourceOptions.additionalParameters);
                }
            });
            self.loader(
                srcOptions.url,
                extent,
                resolution,
                projection,
                srcOptions.featureProjection,
                additionalParameters
            );
        };

        return srcOptions;
    },
    loader: function(url, extent, resolution, projection, featureProjection, additionalParameters) {
        var self = this;
        var params = [
            'srs=' + projection.getCode(),
            'bbox=' + extent.join(',')
        ];
        if($.isFunction(additionalParameters)) {
            params.push(additionalParameters());
        } else if(angular.isObject(additionalParameters)) {
            angular.forEach(additionalParameters, function(value, key) {
                params.push(key + '=' + value);
            });
        }

        $.ajax({
            url: url + params.join('&'),
            dataType: 'json'
        })
        .done(function(response) {
            self.responseHandler(response, featureProjection);
        });
    },
    responseHandler: function(response, featureProjection) {
        var self = this;
        var format = new ol.format.GeoJSON();
        var features = format.readFeatures(response, {
            featureProjection: featureProjection
        });
        self.olSource.addFeatures(features);
    },
    createStyle: function(feature, resolution) {
        if(feature !== undefined &&  feature.get('__layer__') !== this.name) {
            return new ol.style.Style();
        }
        return anol.layer.StaticGeoJSON.prototype.createStyle.call(this, feature, resolution);
    }
});
