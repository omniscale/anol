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
 * @notice
 * Every feature in response must have a '__layer__' property containing the layername given to this layer.
 * Otherwise features will not be styled.
 *
 * Ask *url* with current projection and bbox.
 */
anol.layer.DynamicGeoJSON = function(_options) {
    if(
        angular.isObject(_options) &&
        angular.isObject(_options.olLayer) &&
        angular.isObject(_options.olLayer.source)
    ) {
        this.additionalRequestParameters = _options.olLayer.source.additionalParameters;
    }
    anol.layer.StaticGeoJSON.call(this, _options);
};
anol.layer.DynamicGeoJSON.prototype = new anol.layer.StaticGeoJSON(false);
$.extend(anol.layer.DynamicGeoJSON.prototype, {
    CLASS_NAME: 'anol.layer.DynamicGeoJSON',
    setOlLayer: function(olLayer) {
        anol.layer.StaticGeoJSON.prototype.setOlLayer.call(this, olLayer);
        this.olSource = this.isClustered() ? this.unclusteredSource : olLayer.getSource();
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
        if(this.clusterOptions !== false && this.anolGroup !== other.anolGroup) {
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
        srcOptions.format = new ol.format.GeoJSON();
        srcOptions.strategy = ol.loadingstrategy.bbox;

        srcOptions.loader = function(extent, resolution, projection) {
            var additionalParameters = {};
            angular.forEach(self.olSource.get('anolLayers'), function(layer) {
                if(layer.getVisible()) {
                    additionalParameters = anol.helper.mergeObjects(additionalParameters, self.additionalRequestParameters);
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

        return anol.layer.StaticGeoJSON.prototype._createSourceOptions.call(this,
            srcOptions
        );
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
        // TODO find a better solution
        // remove all features from source.
        // otherwise features in source might be duplicated
        // cause source.readFeatures don't look in source for
        // existing received features.
        // we can't use source.clear() at this place, cause
        // source.clear() will trigger to reload features from server
        // and this leads to an infinite loop
        // even with opt_fast=true
        var sourceFeatures = self.olSource.getFeatures();
        for(var i = 0; i < sourceFeatures.length; i++) {
            self.olSource.removeFeature(sourceFeatures[i]);
        }
        var format = new ol.format.GeoJSON();
        var features = format.readFeatures(response, {
            featureProjection: featureProjection
        });
        self.olSource.addFeatures(features);
    },
    createStyle: function(feature, resolution) {
        if(feature !== undefined && feature.get('__layer__') !== this.name && feature.get('features') === undefined) {
            return new ol.style.Style();
        }
        return anol.layer.StaticGeoJSON.prototype.createStyle.call(this, feature, resolution);
    },
    refresh: function() {
        this.olSource.clear();
        this.olSource.refresh();
    }
});
