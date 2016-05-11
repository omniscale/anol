/**
 * @ngdoc object
 * @name anol.layer.SingleTileWMS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Image
 * @param {Object} options.olLayer.source Options for ol.source.ImageWMS
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
 anol.layer.SingleTileWMS = function(_options) {
    var defaults = {};
    var options = $.extend(true, {}, defaults, _options);

    anol.layer.BaseWMS.call(this, options);
};
anol.layer.SingleTileWMS.prototype = new anol.layer.BaseWMS(false);
$.extend(anol.layer.SingleTileWMS.prototype, {
    CLASS_NAME: 'anol.layer.SingleTileWMS',
    OL_LAYER_CLASS: ol.layer.Image,
    OL_SOURCE_CLASS: ol.source.ImageWMS,
    _createSourceOptions: function(srcOptions) {
        srcOptions = anol.layer.BaseWMS.prototype._createSourceOptions.call(this, srcOptions);
        if(srcOptions.ratio === undefined) {
            srcOptions.ratio = 1;
        }
        return srcOptions;
    }
});
