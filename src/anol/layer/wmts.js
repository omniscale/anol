/**
 * @ngdoc object
 * @name anol.layer.WMTS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Tile
 * @param {Object} options.olLayer.source Options for ol.source.WMTS
 * @param {string} options.olLayer.source.capabilitiesUrl Url to WMTS capabilities document
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 *
 * In options.olLayer.source you can either specify *capabilitiesUrl*
 * or *url*, *layer*, *format* and *extent*.
 * For both variants, *projection* and *matrixSet* is required.
 * Without capabilitiesUrl you can also specify *levels* in source options.
 * The default value is 22.
 */
anol.layer.WMTS = function(_options) {
    var self = this;
    var defaults = {
        olLayer: {
            source: {
                tileSize: [256, 256],
                levels: 22
            }
        }
    };
    var options = $.extend(true, {}, defaults, _options );

    var hqUrl = options.olLayer.source.hqUrl || false;
    delete options.olLayer.source.hqUrl;
    var hqLayer = options.olLayer.source.hqLayer || false;
    delete options.olLayer.source.hqLayer;
    var hqMatrixSet = options.olLayer.source.hqMatrixSet || false;
    delete options.olLayer.source.hqMatrixSet;

    if(ol.has.DEVICE_PIXEL_RATIO > 1) {
        var useHq = false;
        if(hqUrl !== false) {
            options.olLayer.source.url = hqUrl;
            useHq = true;
        }
        if(hqLayer !== false) {
            options.olLayer.source.layer = hqLayer;
            useHq = true;
        }
        if(hqMatrixSet !== false) {
            options.olLayer.source.matrixSet = hqMatrixSet;
            useHq = true;
        }
        if(useHq) {
            options.olLayer.source.tilePixelRatio = 2;
         }
    }

    anol.layer.Layer.call(this, options);
};
anol.layer.WMTS.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.WMTS.prototype, {
    CLASS_NAME: 'anol.layer.WMTS',
    OL_LAYER_CLASS: ol.layer.Tile,
    OL_SOURCE_CLASS: ol.source.WMTS,
    _createResolution: function(levels, minRes) {
        var resolutions = [];
        for(var z = 0; z < levels; ++z) {
            resolutions[z] = minRes / Math.pow(2, z);
        }
        return resolutions;
    },
    _createMatrixIds: function(levels) {
        var matrixIds = [];
        for(var z = 0; z < levels; ++z) {
            matrixIds[z] = z;
        }
        return matrixIds;
    },
    _createRequestUrl: function(options) {
        return options.url +
               options.layer +
               '/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.' +
               options.format.split('/')[1];
    },
    _createSourceOptions: function(srcOptions) {
        srcOptions = anol.layer.Layer.prototype._createSourceOptions(srcOptions);
        var levels = srcOptions.levels;
        var extent = srcOptions.extent || srcOptions.projection.getExtent();
        var w = ol.extent.getWidth(extent);
        var h = ol.extent.getHeight(extent);
        var minRes = Math.max(w / srcOptions.tileSize[0], h / srcOptions.tileSize[1]);
        var url = this._createRequestUrl(srcOptions);

        srcOptions = $.extend(true, {}, srcOptions, {
            url: url,
            tileGrid: new ol.tilegrid.WMTS({
                extent: extent,
                origin: ol.extent.getTopLeft(extent),
                resolutions: this._createResolution(levels, minRes),
                matrixIds: this._createMatrixIds(levels)
            }),
            requestEncoding: 'REST',
            style: 'default'
        });

        return srcOptions;
    }
});
