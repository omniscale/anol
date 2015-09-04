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
 * Capabilities document is used to determine most source options.
 */
anol.layer.WMTS = function(_options) {
    var defaults = {};
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );

    options.olLayer.source = new ol.source.WMTS(
        this._createSourceOptions(options.olLayer.source)
    );

    options.olLayer = new ol.layer.Tile(options.olLayer);

    anol.layer.Layer.call(this, options);
};
anol.layer.WMTS.prototype = new anol.layer.Layer();
$.extend(anol.layer.WMTS.prototype, {
    CLASS_NAME: 'anol.layer.WMTS',
    /**
     * Additional source options:
     * - capabilitiesUrl
     */
    _createSourceOptions: function(srcOptions) {
        srcOptions = anol.layer.Layer.prototype._createSourceOptions(
            srcOptions
        );
        var parser = new ol.format.WMTSCapabilities();
        $.ajax({
            type: 'GET',
            url: srcOptions.capabilitiesUrl,
            async: false,
            success: function(data) {
                var result = parser.read(data);
                var wmtsOptions = ol.source.WMTS.optionsFromCapabilities(
                    result,
                    {
                        layer: srcOptions.layer,
                        matrixSet: srcOptions.projection.getCode()
                    }
                );
                $.extend(srcOptions, wmtsOptions);
            }
        });
        return srcOptions;
    }
});
