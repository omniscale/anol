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

import AnolBaseLayer from '../layer.js'

import Extent from 'ol'
    
import {getWidth, getHeight, getBottomLeft} from 'ol/extent';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import TileGrid from 'ol/tilegrid/TileGrid';

class TMS extends AnolBaseLayer {
    constructor(_options) {
        var defaults = {
            olLayer: {
                source: {
                    tileSize: [256, 256],
                    levels: 22
                }
            }
        };
        var options = $.extend(true, {}, defaults, _options);
        super(options);
        this.CLASS_NAME = 'anol.layer.TMS'
        this.OL_LAYER_CLASS = TileLayer
        this.OL_SOURCE_CLASS = XYZ
    }

    /**
     * Additional source options:
     * - baseUrl
     * - layer
     * - extent
     * - format
     */
    _createSourceOptions(srcOptions) {
        var self = this;
        srcOptions = super._createSourceOptions(srcOptions);
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
            var w = getWidth(extent);
            var h = getHeight(extent);
            var minRes = Math.max(w / sourceOpts.tileSize[0], h / sourceOpts.tileSize[1]);
            srcOptions.tileGrid = new TileGrid({
                origin: getBottomLeft(srcOptions.extent),
                resolutions: self._createResolutions(
                    minRes,
                    srcOptions.levels
                )
            });
        }
        return srcOptions;
    }
    _createResolutions(minRes, levels) {
        var resolutions = [];
        // need one resolution more
        for(var z = 0; z <= levels; ++z) {
            resolutions[z] = minRes / Math.pow(2, z);
        }
        // becouse first resolutions is removed
        // so ol requests 4 tiles instead of one for first zoom level
        resolutions.shift();
        return resolutions;
    }
    tileUrlFunction(tileCoord, baseUrl, layer, format) {
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
    isCombinable(other) {
        var combinable = super.isCombinable(other);
        return false;
    }
}

export default TMS
