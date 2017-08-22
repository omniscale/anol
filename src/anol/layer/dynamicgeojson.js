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

        if(this.isClustered) {
            return this.olLayer.getSource();
        }
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
                    additionalParameters = anol.helper.mergeObjects(additionalParameters, layer.additionalRequestParameters);
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
        var parentFunc = anol.layer.StaticGeoJSON.prototype.createStyle;

        // call parent func when feature is undefined
        if(feature === undefined) {
            return parentFunc.call(this, feature, resolution);
        }

        var features = feature.get('features');

        // normal feature
        if(features === undefined) {
            // return empty style if feature not belongs to this layer
            if(feature.get('__layer__') !== this.name) {
                return new ol.style.Style();
            } else {
                return parentFunc.call(this, feature, resolution);
            }
        }

        // only for cluster features

        // cluster with one feature
        if(features.length === 1) {
            if(features[0].get('__layer__') === this.name) {
                return parentFunc.call(this, features[0], resolution);
            } else {
                return new ol.style.Style();
            }
        }

        // cluster with more than one feature
        return parentFunc.call(this, feature, resolution);
    },
    createClusterStyle: function(clusterFeature) {
        var visible = ol.extent.containsCoordinate(
            this.map.getView().calculateExtent(this.map.getSize()),
            clusterFeature.getGeometry().getCoordinates()
        );
        if(!visible) {
            return new ol.style.Style();
        }
        var self = this;
        var legendItems = {};
        var objCount = 0;
        var layers = this.olLayer.getSource().get('anolLayers');
        clusterFeature.get('features').forEach(function(feature) {
            layers.forEach(function(layer) {
                if(layer.unclusteredSource.getFeatures().indexOf(feature) > -1) {
                    if(layer.name === feature.get('__layer__')) {
                        if(legendItems[layer.name] === undefined) {
                            legendItems[layer.name] = {
                                layer: layer,
                                count: 0
                            };
                            objCount ++;
                        }
                        legendItems[layer.name].count ++;
                    }
                }

            });
        });

        var styles = [];

        var even = objCount % 2 === 0;
        var i = 0;
        var lastXAnchor = 0;
        angular.forEach(legendItems, function(value) {
            var defaultStyle = value.layer.olLayer.getStyle();
            if(angular.isFunction(defaultStyle)) {
                defaultStyle = defaultStyle()[0];
            }

            if(objCount > 1) {
                var styleDefinition = angular.extend({}, value.layer.style);
                if(i % 2 === 0) {
                    styleDefinition.graphicXAnchor = lastXAnchor + i;
                } else {
                    styleDefinition.graphicXAnchor = lastXAnchor - i;
                }

                lastXAnchor = styleDefinition.graphicXAnchor;

                if(!even) {
                    styleDefinition.graphicXAnchor += 0.5;
                }
                styleDefinition.graphicXAnchor *=  styleDefinition.graphicWidth;

                styles.push(
                    new ol.style.Style({
                        image: self.createIconStyle(styleDefinition, defaultStyle.getImage()),
                        text: new ol.style.Text({
                            text: value.count.toString(),
                            offsetX: (styleDefinition.graphicXAnchor - styleDefinition.graphicWidth / 2) * -1,
                            offsetY: styleDefinition.graphicHeight,
                            stroke: new ol.style.Stroke({color: '#fff', width: 2})
                        })
                    })
                );
            } else {
                styles.push(defaultStyle);
                styles.push(new ol.style.Style({
                    text: new ol.style.Text({
                        text: value.count.toString(),
                        offsetY: value.layer.style.graphicHeight,
                        stroke: new ol.style.Stroke({color: '#fff', width: 2})
                    })
                }));
            }
            i++;
        });

        return styles;

    },
    refresh: function() {
        this.olSource.clear();
        this.olSource.refresh();
    }
});
