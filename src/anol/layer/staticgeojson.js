/**
 * @ngdoc object
 * @name anol.layer.StaticGeoJSON
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 * @param {Object} options.olLayer.source.url Url to GeoJSON
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
anol.layer.StaticGeoJSON = function(_options) {
    var defaults = {};
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );

    options.olLayer.source = new ol.source.Vector(
        this._createSourceOptions(options.olLayer.source)
    );

    options.olLayer = new ol.layer.Vector(options.olLayer);

    anol.layer.Layer.call(this, options);
};
anol.layer.StaticGeoJSON.prototype = new anol.layer.Layer();
$.extend(anol.layer.StaticGeoJSON.prototype, {
    CLASS_NAME: 'anol.layer.StaticGeoJSON',
    /**
     * Additional source options
     * - url
     */
    _createSourceOptions: function(srcOptions) {
        srcOptions = anol.layer.Layer.prototype._createSourceOptions(
            srcOptions
        );

        srcOptions.format = new ol.format.GeoJSON();

        return srcOptions;
    }
});
