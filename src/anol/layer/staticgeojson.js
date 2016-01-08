/**
 * @ngdoc object
 * @name anol.layer.StaticGeoJSON
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 * @param {Object} options.olLayer.source.url Url to GeoJSON
 * @param {String} options.olLayer.source.dataProjection Projection if GeoJSON
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
anol.layer.StaticGeoJSON = function(_options) {
    if(_options === false) {
        anol.layer.Feature.call(this, _options);
        return;
    }
    var self = this;
    var defaults = {
        olLayer: {}
    };
    var options = $.extend({},
        defaults,
        _options
    );

    anol.layer.Feature.call(this, options);
    this.loaded = false;

    this.olLayer.getSource().once('change', function() {
        self.loaded = true;
    });
};
anol.layer.StaticGeoJSON.prototype = new anol.layer.Feature(false);
$.extend(anol.layer.StaticGeoJSON.prototype, {
    CLASS_NAME: 'anol.layer.StaticGeoJSON',
    /**
     * Additional source options
     * - url
     * - dataProjection
     */
    _createSourceOptions: function(srcOptions) {
        srcOptions = anol.layer.Feature.prototype._createSourceOptions(
            srcOptions
        );
        // TODO load dataProjection from received GeoJSON
        srcOptions.format = new ol.format.GeoJSON({
            defaultDataProjection: srcOptions.dataProjection
        });
        return srcOptions;
    }
});
