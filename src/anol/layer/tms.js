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
    var defaults = {
        olLayer: {
            source: {
                tileSize: [256, 256],
                levels: 22
            }
        }
    };
    var options = $.extend(true, {}, defaults, _options);

    anol.layer.Layer.call(this, options);
};
anol.layer.TMS.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.TMS.prototype, {
    CLASS_NAME: 'anol.layer.TMS',
    OL_LAYER_CLASS: ol.layer.Tile,
    OL_SOURCE_CLASS: ol.source.XYZ,
    /**
     * Additional source options:
     * - baseUrl
     * - layer
     * - extent
     * - format
     */
    _createSourceOptions: function(srcOptions) {
        var self = this;
        srcOptions = anol.layer.Layer.prototype._createSourceOptions(srcOptions);

        srcOptions.tileUrlFunction = function(tileCoord, pixelRatio, projection) {
            return self.tileUrlFunction(
                tileCoord,
                srcOptions.baseUrl,
                srcOptions.layer,
                srcOptions.format
            );
        };
        if(
            srcOptions.tileGrid === undefined &&
            srcOptions.extent !== undefined
        ) {
            var w = ol.extent.getWidth(extent);
            var h = ol.extent.getHeight(extent);
            var minRes = Math.max(w / sourceOpts.tileSize[0], h / sourceOpts.tileSize[1]);
            srcOptions.tileGrid = new ol.tilegrid.TileGrid({
                origin: ol.extent.getBottomLeft(srcOptions.extent),
                resolutions: self._createResolutions(
                    minRes,
                    srcOptions.levels
                )
            });
        }
        return srcOptions;
    },
    _createResolutions: function(minRes, levels) {
        var resolutions = [];
        // need one resolution more
        for(var z = 0; z <= levels; ++z) {
            resolutions[z] = minRes / Math.pow(2, z);
        }
        // becouse first resolutions is removed
        // so ol requests 4 tiles instead of one for first zoom level
        resolutions.shift();
        return resolutions;
    },
    tileUrlFunction: function(tileCoord, baseUrl, layer, format) {
        var url = '';
        if (tileCoord[1] >= 0 && tileCoord[2] >= 0) {
            url += baseUrl + '/';
            url += layer + '/';
            url += tileCoord[0].toString() + '/';
            url += tileCoord[1].toString() + '/';
            url += tileCoord[2].toString();
            url += '.' + format.split('/')[1];
        }
        return url;
    }
});
