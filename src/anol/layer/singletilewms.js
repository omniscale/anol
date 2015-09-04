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
anol.layer.SingleTileWMS.prototype = new anol.layer.Layer();
$.extend(anol.layer.SingleTileWMS.prototype, {
    CLASS_NAME: 'anol.layer.SingleTileWMS'
});
