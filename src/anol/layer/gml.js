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

import GML2 from 'ol/format/GML2';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';

import VectorSource from 'ol/source/Vector';


class GMLLayer extends FeatureLayer {

    constructor(_options) {
        if(_options === false) {
            super();
            return;
        } 
        // TODO use openlayers gml filter
        if (_options.filter) {
            var filter = '';
                
            if (!angular.isArray(_options.filter.literal)) {
                _options.filter.literal = [_options.filter.literal];                
            }

            angular.forEach(_options.filter.literal, function(literal) {
                filter += 
                        '<PropertyIsEqualTo>' +
                            '<PropertyName>' + _options.filter.propertyName +'</PropertyName>'+
                            '<Literal>'+ literal +'</Literal>'+
                        '</PropertyIsEqualTo>';
            })
            if (angular.isDefined(_options.filter.filterType)) {
                filter = 
                    '<Filter>'+
                        '<'+_options.filter.filterType + '>' +  
                            filter +
                        '</'+ _options.filter.filterType +'>'+
                    '</Filter>';
            } else {
                filter = '<Filter>'+ filter + '</Filter>';                
            }
            _options.olLayer.source.url = _options.olLayer.source.url + 'FILTER=' + filter; 
        }

        var defaults = {
            olLayer: {
                source: {
                    format: new GML2()
                },
                style: new Style({
                    stroke: new Stroke({
                        color: 'rgba(255,0,0,1)',
                        width: 1
                    }),
                    fill: new Fill({
                        color: 'rgba(255,0,0,0.3)'
                    })
                })
            }
        };
        var options = $.extend(true, {}, defaults, _options);
        super(options);
        this.method = options.method || 'GET';
        this.CLASS_NAME = 'anol.layer.GML';
    }

    _createSourceOptions(srcOptions) {
        var self = this;
        srcOptions.loader = function() {
            self.loader(
                srcOptions.url
            );
        };
        return super._createSourceOptions(srcOptions);
    }

    loader(url) {
        var self = this;
        $.ajax({
            method: this.method,
            url: url
        }).done(function(response) {
            self.responseHandler(response);
        });
    }
    responseHandler(response) {
        var self = this;
        var sourceFeatures = self.olLayer.getSource().getFeatures();
        for(var i = 0; i < sourceFeatures.length; i++) {
            self.olLayer.getSource().removeFeature(sourceFeatures[i]);
        }  

        var format = new GML2();
        var features = format.readFeatures(response);
        self.olLayer.getSource().addFeatures(features);
    }    
}

export default GMLLayer;
