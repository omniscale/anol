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
    var defaults = {};
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );
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
anol.layer.WMTS.prototype = new anol.layer.Layer();
$.extend(anol.layer.WMTS.prototype, {
    CLASS_NAME: 'anol.layer.WMTS',
    _createResolution: function(levels, size) {
        var resolutions = [];
        for(var z = 0; z < levels; ++z) {
            resolutions[z] = size / Math.pow(2, z);
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
        var levels = sourceOpts.levels || 22;
        var size = ol.extent.getWidth(sourceOpts.extent) / 256;
        var url = this._createRequestUrl(sourceOpts);

        sourceOpts = anol.layer.Layer.prototype._createSourceOptions(
            sourceOpts
        );

        deferred.resolve($.extend(sourceOpts, {
            url: url,
            tileGrid: new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(sourceOpts.extent),
                resolutions: this._createResolution(levels, size),
                matrixIds: this._createMatrixIds(levels)
            }),
            requestEncoding: 'REST',
            style: 'default',
            wrapX: true
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
