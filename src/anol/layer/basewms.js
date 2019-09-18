/**
 * @ngdoc object
 * @name anol.layer.BaseWMS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Image
 * @param {Object} options.olLayer.source Options for ol.source.ImageWMS
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */

import AnolBaseLayer from '../layer.js';

class BaseWMS extends AnolBaseLayer {
    constructor(_options) {
        super(_options);
        this.CLASS_NAME = 'anol.layer.BaseWMS';
        this.OL_LAYER_CLASS = undefined;
        this.OL_SOURCE_CLASS = undefined;

        if(angular.isUndefined(_options)) {
            return;
        }

        var defaults = {};
        this.options = $.extend(true, {}, defaults, _options);

        this.wmsSourceLayers = anol.helper.stringSplit(this.olSourceOptions.params.LAYERS, ',');
        if(this.olLayerOptions.visible === false) {
            this.olSourceOptions.params.LAYERS = '';
        }
        this.visible = this.olLayerOptions.visible !== false;
    }

    isCombinable(other) {
        var combinable = super.isCombinable(other);
        if(!combinable) {
            return false;
        }

        if (angular.isDefined(other.anolGroup)) {
            combinable = other.anolGroup.isCombinable();
            if(!combinable) {
                return false;
            }
        }
        if(this.olSourceOptions.url !== other.olSourceOptions.url) {
            return false;
        }
        if (this.isBackground) {
            return false;
        }
        var thisParams = $.extend(true, {}, this.olSourceOptions.params);
        delete thisParams.LAYERS;
        var otherParams = $.extend(true, {}, other.olSourceOptions.params);
        delete otherParams.LAYERS;
        if(!angular.equals(thisParams, otherParams)) {
            return false;
        }
        if(!angular.equals(this.anolGroup, other.anolGroup)) {
            return false;
        }
        if (this.catalog) {
            return false;
        }
        return false;
    }

    getCombinedSource(other) {
        var olSource = this.olLayer.getSource();
        if(other.olLayerOptions.visible !== false) {
            var params = olSource.getParams();
            var layers = anol.helper.stringSplit(params.LAYERS, ',');
            layers = layers.concat(other.wmsSourceLayers);
            params.LAYERS = layers.join(',');
            olSource.updateParams(params);
        }
        var anolLayers = olSource.get('anolLayers');
        anolLayers.push(other);
        olSource.set('anolLayers', anolLayers);
        return olSource;
    }

    removeOlLayer() {
        if(this.combined) {
            var olSource = this.olLayer.getSource();
            var anolLayers = olSource.get('anolLayers');
            var idx = anolLayers.indexOf(this);
            if(idx > -1) {
                anolLayers.splice(idx, 1);
            }
            olSource.set('anolLayers', anolLayers);

            // update layer params 
            var layerParams = [];
            angular.forEach(anolLayers, function(layer) {
                if (layer.getVisible()) {
                    layerParams.push(layer.name);
                }
            })
            var params = olSource.getParams();
            params.LAYERS = layerParams.reverse().join(',');
            olSource.updateParams(params);
        } 
    }
    getVisible() {
        if(angular.isUndefined(this.olLayer)) {
            return this.visible;
        }
        return this.olLayer.getVisible();
    }
    reOrderLayerParams(layers) {
        var olSource = this.olLayer.getSource();
        var layerParams = [];
        var self = this;
        var anolLayers = [];
        $.each(layers, function(idx, layer) {
            if (layer.olLayer.ol_uid == self.olLayer.ol_uid) {
                anolLayers.push(layer);
                if (layer.getVisible()) {
                    layerParams.push(layer.name);
                }
            }
        });
        olSource.set('anolLayers', anolLayers);
        var params = olSource.getParams();
        params.LAYERS = layerParams.reverse().join(',');
        olSource.updateParams(params);
    }    
    setVisible(visible) {
        if (visible == this.getVisible()) {
            return;
        }     
        var insertLayerIdx = 0;
        var source = this.olLayer.getSource();
        var self = this;
        $.each(source.get('anolLayers'), function(idx, layer) {
            if(layer === self) {
                return false;
            }
            if(layer.getVisible()) {
                insertLayerIdx += layer.wmsSourceLayers.length;
            }
        });
        var params = source.getParams();
        var layers = anol.helper.stringSplit(params.LAYERS, ',');
        layers = layers.reverse();
        if(!visible) {
            layers = anol.helper.excludeList(layers, this.wmsSourceLayers);
        } else {
            layers = anol.helper.concat(layers, this.wmsSourceLayers, insertLayerIdx);
        }
        params.LAYERS = layers.reverse().join(',');
        source.updateParams(params);
        this.visible = visible;
        super.setVisible(layers.length > 0);
    }
    getLegendGraphicUrl() {
        var requestParams = {
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            SLD_VERSION: '1.1.0',
            REQUEST: 'GetLegendGraphic',
            FORMAT: 'image/png',
            LAYER: this.wmsSourceLayers.join(',')
        };
        if(angular.isDefined(this.legend.version)) {
            requestParams.VERSION = this.legend.version;
        }
        if(angular.isDefined(this.legend.sldVersion)) {
            requestParams.SLD_VERSION = this.legend.sldVersion;
        }
        if(angular.isDefined(this.legend.format)) {
            requestParams.FORMAT = this.legend.format;
        }
        var url = this.olLayer.getSource().getUrl();
        if(url.indexOf('?') === -1) {
            url += '?';
        } else if(url.lastIndexOf('&') !== url.length - 1) {
            url += '&';
        }

        return url + $.param(requestParams);
    }
    getFeatureInfoUrl(coordinate, resolution, projection, params) {
        var requestParams = $.extend(true,
            {},
            {
                QUERY_LAYERS: this.wmsSourceLayers.join(','),
                LAYERS: this.wmsSourceLayers.join(',')
            },
            params
        );

        return this.olLayer.getSource().getGetFeatureInfoUrl(
            coordinate, resolution, projection, requestParams
        );
    }
}

export default BaseWMS;

