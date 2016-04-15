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
 anol.layer.BaseWMS = function(_options) {
    if(_options === false) {
        anol.layer.Layer.call(this, _options);
        return;
    }
    var defaults = {};
    var options = $.extend(true, {}, defaults, _options);

    anol.layer.Layer.call(this, options);
    this.wmsSourceLayers = anol.helper.stringSplit(this.olSourceOptions.params.LAYERS, ',');
    if(this.olLayerOptions.visible === false) {
        this.olSourceOptions.params.LAYERS = '';
    }
};
anol.layer.BaseWMS.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.BaseWMS.prototype, {
    CLASS_NAME: 'anol.layer.BaseWMS',
    OL_LAYER_CLASS: undefined,
    OL_SOURCE_CLASS: undefined,
    isCombinable: function(other) {
        var combinable = anol.layer.Layer.prototype.isCombinable.call(this, other);
        if(!combinable) {
            return false;
        }
        if(this.olSourceOptions.url !== other.olSourceOptions.url) {
            return false;
        }
        var thisParams = $.extend(true, {}, this.olSourceOptions.params);
        delete thisParams.LAYERS;
        var otherParams = $.extend(true, {}, other.olSourceOptions.params);
        delete otherParams.LAYERS;
        if(!angular.equals(thisParams, otherParams)) {
            return false;
        }
        return true;
    },
    getCombinedSource: function(other) {
        var olSource = this.olLayer.getSource();
        if(other.olLayerOptions.visible === true) {
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
    },
    setVisible: function(visible)  {
        var insertLayerIdx = 0;
        var source = this.olLayer.getSource();
        $.each(source.get('anolLayers'), function(idx, layer) {
            if(layer === this) {
                return false;
            }
            if(layer.getVisible()) {
                insertLayerIdx += layer.wmsSourceLayers.length;
            }
        });
        var params = source.getParams();
        var layers = anol.helper.stringSplit(params.LAYERS, ',');
        if(!visible) {
            layers = anol.helper.excludeList(layers, this.wmsSourceLayers);
        } else {
            layers = anol.helper.concat(layers, this.wmsSourceLayers, insertLayerIdx);
        }
        params.LAYERS = layers.join(',');
        source.updateParams(params);
        anol.layer.Layer.prototype.setVisible.call(this, visible);
    },
    getLegendGraphicUrl: function() {
        var requestParams = {
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            SLD_VERSION: '1.1.0',
            REQUEST: 'GetLegendGraphic',
            FORMAT: 'image/png',
            LAYER: this.wmsSourceLayers.join(',')
        };
        if(this.legend.version !== undefined) {
            requestParams.VERSION = this.legend.version;
        }
        if(this.legend.sldVersion !== undefined) {
            requestParams.SLD_VERSION = this.legend.sldVersion;
        }
        if(this.legend.format !== undefined) {
            requestParams.FORMAT = this.legend.format;
        }

        return this.olLayer.getSource().getUrl() + $.param(requestParams);
    },
    getFeatureInfoUrl: function(coordinate, resolution, projection, params) {
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
});