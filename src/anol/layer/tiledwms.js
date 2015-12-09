/**
 * @ngdoc object
 * @name anol.layer.TiledWMS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Tile
 * @param {Object} options.olLayer.source Options for ol.source.TileWMS
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
 anol.layer.TiledWMS = function(_options) {
    var defaults = {};
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );

    options.olLayer.source = new ol.source.TileWMS(
        this._createSourceOptions(options.olLayer.source)
    );

    options.olLayer = new ol.layer.Tile(options.olLayer);

    anol.layer.Layer.call(this, options);
};
anol.layer.TiledWMS.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.TiledWMS.prototype, {
    CLASS_NAME: 'anol.layer.TiledWMS'
});
