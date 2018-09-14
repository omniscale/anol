/**
 * @ngdoc object
 * @name anol.layer.StaticGeoJSON
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 * @param {Object} options.olLayer.source.url Url to GeoJSON
 * @param {String} options.olLayer.source.dataProjection Projection if GeoJSON
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */

import FeatureLayer from './feature.js';

import GeoJSON from 'ol/format/GeoJSON';
import VectorSource from 'ol/source/Vector';


class StaticGeoJSON extends FeatureLayer {

    constructor(_options) {
        if(_options === false) {
            super();
            return;
        }
        var defaults = {};
        var options = $.extend({}, defaults, _options);
        super(options);

        this.loaded = false;
        this.CLASS_NAME = 'anol.layer.StaticGeoJSON';
    }

    setOlLayer(olLayer) {
        super.setOlLayer(olLayer);
        
        var self = this;
        olLayer.getSource().once('change', function() {
            self.loaded = true;
        });
    }

    /**
     * Additional source options
     * - url
     * - dataProjection
     */
    _createSourceOptions(srcOptions) {
        var self = this;
        srcOptions.format = new GeoJSON({
            dataProjection: srcOptions.dataProjection
        });
        if (!angular.isFunction(srcOptions.loader)) {
            srcOptions.loader = function() {
                self.loader(
                    srcOptions.url,
                    srcOptions.featureProjection,
                    srcOptions.dataProjection
                );
            };
        }
        return super._createSourceOptions(srcOptions);
    }
    loader(url, featureProjection, dataProjection) {
        var self = this;
        $.ajax({
            url: url,
            dataType: 'json'
        }).done(function(response) {
            self.responseHandler(response, featureProjection, dataProjection);
        });
    }
    responseHandler(response, featureProjection, dataProjection) {
        var self = this;
        var sourceFeatures = self.olLayer.getSource().getFeatures();
        for(var i = 0; i < sourceFeatures.length; i++) {
            self.olLayer.getSource().removeFeature(sourceFeatures[i]);
        }  
        var format = new GeoJSON({
            dataProjection: dataProjection,
        });
        var features = format.readFeatures(
            response, {
                dataProjection: dataProjection,
                featureProjection: featureProjection
            }
        );
        self.olLayer.getSource().addFeatures(features);
    }
    /**
     * Replaces source by new one with given url
     * - url
     */
    changeUrl(url) {
        this.loaded = false;
        this.olSourceOptions.url = url;
        var newSource = new VectorSource(this.olSourceOptions);
        newSource.once('change', function() {
            self.loaded = true;
        });
        this.olLayer.setSource(newSource);
    }
}

export default StaticGeoJSON;
