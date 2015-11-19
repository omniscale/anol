/**
 * @ngdoc object
 * @name anol.layer.Layer
 *
 * @param {Object} options AnOl Layer options
 * @param {string} options.title Layer title
 * @param {string} options.displayInLayerswitcher Show in layerswitcher
 * @param {boolean} options.isBackgorund Define layer as background layer
 * @param {Object} options.featureinfo Stores informations for feature info
 * @param {string} options.featureinfo.target Target of *GetFeatureInfo* request for {@link api/anol.featureinfo anol.featureinfo}. Supported values are:
 * - *_popup* - Results displayed in a popup
 * - *_blank* - Results displayed in a new window/tab
 * - *[id]* - Id of html element to display results in
 * @param {Array<string>} options.featureinfo.properties List of feature properties to show in {@link api/anol.featurepopup anol.featurepopup}.
 * @param {Object} options.legend Stores informations for legend
 * @param {string} options.legend.type Type of legend entry. Supported values are:
 * - *point* - Extracts point style of vector layer for legend
 * - *line* - Extracts line style of vector layer for legend
 * - *polygon* - Extracts polygon style of vector layer for legend
 * - *GetLegendGraphic* - Use options.legend.url for legend
 * @param {string} options.legend.url Url to image for display in legend
 * @param {string} otpions.legend.target Id of html element to display legend image in. (Only for options.legend.type == 'GetLegendGraphic').
 *                                       If empty, legend image is shown in legend control
 * @param {Object} options.olLayer OpenLayers layer object
 *
 * @description
 * Object for wrapping ol3 layers and add properties to them
 * You can create a normal ol3 layer and give it to a anol.layer.Layer
 *
 * @example
 * ```js
 *   // create ol layer
 *   var olLayer = new ol.layer.Vector({
 *     source: new ol.source.Vector()
 *   });
 *   var anolLayer = new anol.layer.Layer({
 *     title: "Awesome layer",
 *     olLayer: olLayer
 *   });
 * ```
 */
anol.layer.Layer = function(options) {
    if(options === undefined) {
        return;
    }

    this.name = options.name;
    this.title = options.title;
    this.displayInLayerswitcher = options.displayInLayerswitcher === undefined ? true : options.displayInLayerswitcher;
    this.isBackground = options.isBackground || false;
    this.featureinfo = options.featureinfo || false;
    this.legend = options.legend || false;
    this.attribution = options.attribution || undefined;
    this.isVector = false;

    this.olLayer = options.olLayer;
    if(!(this.olLayer instanceof ol.layer.Base)) {
        throw 'Cannot create object without ol layer';
    }
    this.olLayer.set('anolLayer', this);
};

anol.layer.Layer.prototype = {
    CLASS_NAME: 'anol.layer.Layer',
    DEFAULT_OPTIONS: {
        olLayer: {
            source: undefined
        }
    },
    getVisible: function() {
        var self = this;
        return self.olLayer.getVisible();
    },
    setVisible: function(visible)  {
        var self = this;
        self.olLayer.setVisible(visible);
    },
    onVisibleChange: function(func) {
        var self = this;
        return self.olLayer.on('change:visible', func);
    },
    offVisibleChange: function(key) {
        var self = this;
        self.olLayer.off(key);
    },
    _createSourceOptions: function(srcOptions) {
        srcOptions = srcOptions || {};
        if(srcOptions.tilePixelRatio !== undefined) {
            srcOptions.tilePixelRatio = ol.has.DEVICE_PIXEL_RATIO > 1 ? srcOptions.tilePixelRatio : 1;
        }
        return srcOptions;
    }
};

