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
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );

    options.olLayer.source = new ol.source.ImageWMS(
        this._createSourceOptions(options.olLayer.source)
    );

    options.olLayer = new ol.layer.Image(options.olLayer);

    anol.layer.Layer.call(this, options);
};
anol.layer.SingleTileWMS.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.SingleTileWMS.prototype, {
    CLASS_NAME: 'anol.layer.SingleTileWMS'
});
