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
    var defaults = {};
    var options = $.extend({}, defaults, _options);

    this.loaded = false;

    anol.layer.Feature.call(this, options);
};
anol.layer.StaticGeoJSON.prototype = new anol.layer.Feature(false);
$.extend(anol.layer.StaticGeoJSON.prototype, {
    CLASS_NAME: 'anol.layer.StaticGeoJSON',
    setOlLayer: function(olLayer) {
        var self = this;
        anol.layer.Feature.prototype.setOlLayer.call(this, olLayer);
        olLayer.getSource().once('change', function() {
            self.loaded = true;
        });
    },
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
    },
    /**
     * Replaces source by new one with given url
     * - url
     */
    changeUrl: function(url) {
        this.loaded = false;
        this.olSourceOptions.url = url;
        var newSource = new ol.source.Vector(this.olSourceOptions);
        newSource.once('change', function() {
            self.loaded = true;
        });
        this.olLayer.setSource(newSource);
    }
});
