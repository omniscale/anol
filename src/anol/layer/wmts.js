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
    var defaults = {
        olLayer: {
            source: {
                tileSize: [256, 256],
                levels: 22
            }
        }
    };
    var options = $.extend(true, {},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );

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

    // copy layer options without source. it will be added later
    var layerOpts = $.extend({}, options.olLayer, {source: null});
    var olLayer = new ol.layer.Tile(layerOpts);

    var promise;
    if(options.olLayer.source.capabilitiesUrl !== undefined) {
        promise = this._createSourceOptionsFromCapabilities(options.olLayer.source);
    } else {
        promise = this._createSourceOptions(options.olLayer.source);
    }
    promise.then(function(sourceOpts) {
        olLayer.setSource(new ol.source.WMTS(sourceOpts));
    });

    options.olLayer = olLayer;
    anol.layer.Layer.call(this, options);
};
anol.layer.WMTS.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.WMTS.prototype, {
    CLASS_NAME: 'anol.layer.WMTS',
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
    _createSourceOptions: function(sourceOpts) {
        var deferred = $.Deferred();
        var levels = sourceOpts.levels;
        var extent = sourceOpts.extent || sourceOpts.projection.getExtent();
        var w = ol.extent.getWidth(extent);
        var h = ol.extent.getHeight(extent);
        var minRes = Math.max(w / sourceOpts.tileSize[0], h / sourceOpts.tileSize[1]);
        var url = this._createRequestUrl(sourceOpts);

        sourceOpts = anol.layer.Layer.prototype._createSourceOptions(
            sourceOpts
        );

        deferred.resolve($.extend(sourceOpts, {
            url: url,
            tileGrid: new ol.tilegrid.WMTS({
                extent: extent,
                origin: ol.extent.getTopLeft(extent),
                resolutions: this._createResolution(levels, minRes),
                matrixIds: this._createMatrixIds(levels)
            }),
            requestEncoding: 'REST',
            style: 'default'
        }));
        return deferred.promise();
    },
    _createSourceOptionsFromCapabilities: function(sourceOpts) {
        var deferred = $.Deferred();
        sourceOpts = anol.layer.Layer.prototype._createSourceOptions(
            sourceOpts
        );
        var parser = new ol.format.WMTSCapabilities();
        $.ajax({
            type: 'GET',
            url: sourceOpts.capabilitiesUrl + 'REQUEST=GetCapabilities',
            async: false,
            success: function(data) {
                var result = parser.read(data);
                var wmtsOptions = ol.source.WMTS.optionsFromCapabilities(
                    result,
                    {
                        layer: sourceOpts.layer,
                        projection: sourceOpts.projection,
                        matrixSet: sourceOpts.matrixSet
                    }
                );
                $.extend(sourceOpts, wmtsOptions);
                deferred.resolve(sourceOpts);
            }
        });
        return deferred.promise();
    }
});
