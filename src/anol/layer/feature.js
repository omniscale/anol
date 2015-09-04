/**
 * @ngdoc object
 * @name anol.layer.Feature
 *
 * @param {Object} options AnOl Layer options
 * @param {string} options.geometryType Geometry type of features for automatic legend generation. Supportet types are:
 * - point
 * - line
 * - polygon
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
 anol.layer.Feature = function(_options) {
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
    this.geometryType = options.geometryType || false;

    anol.layer.Layer.call(this, options);
};
anol.layer.Feature.prototype = new anol.layer.Layer();
$.extend(anol.layer.Feature.prototype, {
    CLASS_NAME: 'anol.layer.Feature'
});
