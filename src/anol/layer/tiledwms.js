/**
 * @ngdoc object
 * @name anol.layer.TiledWMS
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Tile
 * @param {Object} options.olLayer.source Options for ol.source.TileWMS
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */

import BaseWMS from './basewms.js'

import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

class TiledWMS extends BaseWMS {

    constructor(_options) {
	    var defaults = {};
    	var options = jQuery.extend(true, {}, defaults, _options );
        super(options);

        this.CLASS_NAME = 'anol.layer.TiledWMS';
        this.OL_LAYER_CLASS = TileLayer;
        this.OL_SOURCE_CLASS = TileWMS;
    }
}

export default TiledWMS;
