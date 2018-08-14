/**
 * @ngdoc object
 * @name anol.layer.SingleTileWMS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Image
 * @param {Object} options.olLayer.source Options for ol.source.ImageWMS
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
import BaseWMS from './basewms.js'

import ImageLayer from 'ol/layer/Image';
import ImageWMS from 'ol/source/ImageWMS';

class SingleTileWMS extends BaseWMS {

    constructor(_options) {
        var defaults = {};
        var options = $.extend(true, {}, defaults, _options);
        super(options);

        this.CLASS_NAME = 'anol.layer.SingleTileWMS';
        this.OL_LAYER_CLASS = ImageLayer;
        this.OL_SOURCE_CLASS = ImageWMS;
    }

    _createSourceOptions(srcOptions) {
        srcOptions = super._createSourceOptions(srcOptions);
        if(srcOptions.ratio === undefined) {
            srcOptions.ratio = 1;
        }
        return srcOptions;
    }    
}

export default SingleTileWMS;

