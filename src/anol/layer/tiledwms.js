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

import BaseWMS from './basewms.js';

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

	getLegendGraphicUrl() {
        var requestParams = {
            SERVICE: 'WMS',
            VERSION: '1.3.0',
            SLD_VERSION: '1.1.0',
            REQUEST: 'GetLegendGraphic',
            FORMAT: 'image/png',
            LAYER: this.wmsSourceLayers.join(',')
        };
        if(angular.isDefined(this.legend.version)) {
            requestParams.VERSION = this.legend.version;
        }
        if(angular.isDefined(this.legend.sldVersion)) {
            requestParams.SLD_VERSION = this.legend.sldVersion;
        }
        if(angular.isDefined(this.legend.format)) {
            requestParams.FORMAT = this.legend.format;
        }
        var urls = this.olLayer.getSource().getUrls();
        var url = urls[0];
        if(url.indexOf('?') === -1) {
            url += '?';
        } else if(url.lastIndexOf('&') !== url.length - 1) {
            url += '&';
        }
        return url + $.param(requestParams);
    }

}

export default TiledWMS;
