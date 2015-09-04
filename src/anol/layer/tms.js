/**
 * @ngdoc object
 * @name anol.layer.TMS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Tile
 * @param {Object} options.olLayer.source Options for ol.source.TileImage
 * @param {string} options.olLayer.source.baseUrl BaseUrl for TMS requests
 * @param {string} options.olLayer.source.layer Requested layer
 * @param {Array<number>} options.olLayer.source.resolutions List of resolutions
 * @param {string} options.olLayer.source.format Image format
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
 anol.layer.TMS = function(_options) {
    var defaults = {};
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );

    options.olLayer.source = new ol.source.TileImage(
        this._createSourceOptions(options.olLayer.source)
    );

    options.olLayer = new ol.layer.Tile(options.olLayer);

    anol.layer.Layer.call(this, options);
};
anol.layer.TMS.prototype = new anol.layer.Layer();
$.extend(anol.layer.TMS.prototype, {
    CLASS_NAME: 'anol.layer.TMS',
    /**
     * Additional source options:
     * - baseUrl
     * - layer
     * - resolutions
     * - format
     */
    _createSourceOptions: function(srcOptions) {
        var self = this;
        srcOptions = anol.layer.Layer.prototype._createSourceOptions(
            srcOptions
        );

        srcOptions.tileUrlFunction = function(tileCoord, pixelRatio, projection) {
            return self.tileUrlFunction(
                tileCoord,
                srcOptions.baseUrl,
                srcOptions.layer,
                srcOptions.format
            );
        };

        if(srcOptions.extent && srcOptions.resolution) {
            srcOptions.tileGrid = new ol.tilegrid.TileGrid({
                origin: [srcOptions.extent[0], srcOptions.extent[1]],
                resolutions: srcOptions.resolutions
            });
        }

        return srcOptions;
    },
    tileUrlFunction: function(tileCoord, baseUrl, layer, format) {
        var url = '';
            if (tileCoord[1] >= 0 && tileCoord[2] >= 0) {
                url += baseUrl + '/';
                url += layer + '/';
                url += tileCoord[0].toString() + '/';
                url += tileCoord[1].toString() + '/';
                url += tileCoord[2].toString();
                url += '.' + format;
            }
            return url;
    }
});
