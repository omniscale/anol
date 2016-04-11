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
};
anol.layer.BaseWMS.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.BaseWMS.prototype, {
    CLASS_NAME: 'anol.layer.BaseWMS',
    OL_LAYER_CLASS: undefined,
    OL_SOURCE_CLASS: undefined,
    isCombinable: function(other) {
        combinable = anol.layer.Layer.prototype.isCombinable.call(this, other);
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
    getCombinedOlLayer: function(other) {
        var source = this.olLayer.getSource();
        var params = source.getParams();
        var layers = params.LAYERS.split(',');
        var otherLayers = anol.helper.stringSplit(other.olSourceOptions.params.LAYERS, ',');
        params.LAYERS = layers.concat(otherLayers).join(',');
        source.updateParams(params);
        return this.olLayer;
    },
    setVisible: function(visible)  {
        var source = this.olLayer.getSource();
        var params = source.getParams();
        var layers = anol.helper.stringSplit(params.LAYERS, ',');
        if(!visible) {
            layers = anol.helper.excludeList(layers, this.wmsSourceLayers);
        } else {
            layers = anol.helper.concatDistinct(layers, this.wmsSourceLayers);
        }
        this.olLayer.setVisible(layers.length !== 0);
        params.LAYERS = layers.join(',');
        source.updateParams(params);
        $(this).triggerHandler('anol.layer.visible:change', [this]);
    },
    getVisible: function() {
        var params = this.olLayer.getSource().getParams();
        var layers = anol.helper.stringSplit(params.LAYERS, ',');
        return anol.helper.allInList(layers, this.wmsSourceLayers);
    }
});
