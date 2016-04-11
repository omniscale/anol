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
    var options = $.extend(true, {}, defaults, _options );

    anol.layer.BaseWMS.call(this, options);
};
anol.layer.TiledWMS.prototype = new anol.layer.BaseWMS(false);
$.extend(anol.layer.TiledWMS.prototype, {
    CLASS_NAME: 'anol.layer.TiledWMS',
    OL_LAYER_CLASS: ol.layer.Tile,
    OL_SOURCE_CLASS: ol.source.TileWMS
});
