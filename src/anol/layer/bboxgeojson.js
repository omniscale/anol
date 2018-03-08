/**
 * @ngdoc object
 * @name anol.layer.BBOXGeoJSON
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
anol.layer.BBOXGeoJSON = function(_options) {
    if(
        angular.isObject(_options) &&
        angular.isObject(_options.olLayer) &&
        angular.isObject(_options.olLayer.source)
    ) {
        this.additionalRequestParameters = _options.olLayer.source.additionalParameters;
    }
    anol.layer.StaticGeoJSON.call(this, _options);
};
anol.layer.BBOXGeoJSON.prototype = new anol.layer.StaticGeoJSON(false);
$.extend(anol.layer.BBOXGeoJSON.prototype, {
    CLASS_NAME: 'anol.layer.BBOXGeoJSON',
    setOlLayer: function(olLayer) {
        anol.layer.StaticGeoJSON.prototype.setOlLayer.call(this, olLayer);
        this.olSource = olLayer.getSource();
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
        console.log("Humpty")
        srcOptions.loader = function(extent, resolution, projection) {
            var additionalParameters = {};
            angular.forEach(self.olSource.get('anolLayers'), function(layer) {
                if(layer.getVisible()) {
                    additionalParameters = anol.helper.mergeObjects(additionalParameters, layer.additionalRequestParameters);
                }
            });
            self.loader(
                srcOptions.url,
                extent,
                resolution,
                projection,
                srcOptions.featureProjection,
                srcOptions.extentProjection,
                additionalParameters
            );
        };

        return anol.layer.StaticGeoJSON.prototype._createSourceOptions.call(this,
            srcOptions
        );
    },
    loader: function(url, extent, resolution, projection, featureProjection, extentProjection, additionalParameters) {
        var self = this;
        if (extentProjection !== undefined) {
            extent = ol.proj.transformExtent(extent, projection, extentProjection);
        } 
        var params = [
            'srs=' + extentProjection.getCode(),
            'bbox=' + extent.join(','),
            'resolution=' + resolution,
            'zoom=' + self.map.getView().getZoom()
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
            self.responseHandler(response, featureProjection, projection);
        });
    },
    responseHandler: function(response, featureProjection, projection) {
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

        var format = new ol.format.GeoJSON({
            defaultDataProjection: projection.getCode()
        });

        var features = format.readFeatures(
          response, {
            defaultDataProjection: projection.getCode(),
            featureProjection: featureProjection.getCode()
          }
        );

        self.olSource.addFeatures(features);
    },
    refresh: function() {
        this.olSource.clear();
        this.olSource.refresh();
    }
});
