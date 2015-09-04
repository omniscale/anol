/*
 * @ngdoc object
 * @name anol.layer.Layer
 *
 * @param name
 * @param title
 * @param displayInLayerswitcher
 * @param isBackgorund
 * @param featureinfo
 * @param geometryType
 * @param olLayer
 *
 * @description Object for wrapping ol3 layers and add properties to them
 */
anol.layer.Layer = function(options) {
    if(options === undefined) {
        return;
    }

    this.name = options.name;
    this.title = options.title;
    this.displayInLayerswitcher = options.displayInLayerswitcher || true;
    this.isBackground = options.isBackground || false;
    this.featureinfo = options.featureinfo || false;

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
    _createSourceOptions: function(srcOptions) {
        srcOptions = srcOptions || {};
        if(srcOptions.attribution !== undefined) {
            srcOptions.attributions = [new ol.Attribution({
                html: srcOptions.attribution
            })];
            delete srcOptions.attribution;
        }
        return srcOptions;
    }
};

