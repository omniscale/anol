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

    this._source = this.olLayer.getSource();
};
anol.layer.DynamicGeoJSON.prototype = new anol.layer.StaticGeoJSON(false);
$.extend(anol.layer.DynamicGeoJSON.prototype, {
    CLASS_NAME: 'anol.layer.DynamicGeoJSON',
    /**
     * Additional source options
     * - url
     * - featureProjection
     * - additionalParameters
     */
    _createSourceOptions: function(srcOptions) {
        var self = this;
        srcOptions = anol.layer.Layer.prototype._createSourceOptions(
            srcOptions
        );

        srcOptions.format = new ol.format.GeoJSON();
        srcOptions.strategy = ol.loadingstrategy.bbox;

        srcOptions.loader = function(extent, resolution, projection) {
            self.loader(
                srcOptions.url,
                extent,
                resolution,
                projection,
                srcOptions.featureProjection,
                srcOptions.additionalParameters
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
        // TODO find a better solution
        // remove all features from source.
        // otherwise features in source might be duplicated
        // cause source.readFeatures don't look in source for
        // existing received features.
        // we can't use source.clear() at this place, cause
        // source.clear() will trigger to reload features from server
        // and this leads to an infinite loop
        // even with opt_fast=true
        var sourceFeatures = self._source.getFeatures();
        for(var i = 0; i < sourceFeatures.length; i++) {
            self._source.removeFeature(sourceFeatures[i]);
        }
        var format = new ol.format.GeoJSON();
        var features = format.readFeatures(response, {
            featureProjection: featureProjection
        });
        self._source.addFeatures(features);
    }
});
