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

import AnolBaseLayer from '../layer.js'

import TileLayer from 'ol/layer/Tile';
import { default as WMTSSource} from 'ol/source/WMTS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { getWidth, getHeight, getTopLeft} from 'ol/extent.js';
import { DEVICE_PIXEL_RATIO } from 'ol/has'

class WMTS extends AnolBaseLayer {
    
    constructor(_options) {
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

        if(DEVICE_PIXEL_RATIO > 1) {
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
        super(options);
        this.CLASS_NAME = 'anol.layer.WMTS';
        this.OL_LAYER_CLASS = TileLayer;
        this.OL_SOURCE_CLASS = WMTSSource;
    }
    _createResolution(levels, minRes) {
        var resolutions = [];
        for(var z = 0; z < levels; ++z) {
            resolutions[z] = minRes / Math.pow(2, z);
        }
        return resolutions;
    }
    _createMatrixIds(levels) {
        var matrixIds = [];
        for(var z = 0; z < levels; ++z) {
            matrixIds[z] = z;
        }
        return matrixIds;
    }
    _createRequestUrl(options) {
        return options.url +
               options.layer +
               '/{TileMatrixSet}/{TileMatrix}/{TileCol}/{TileRow}.' +
               options.format.split('/')[1];
    }
    _createSourceOptions(srcOptions) {
        srcOptions = super._createSourceOptions(srcOptions);
        var levels = srcOptions.levels;
        var extent = srcOptions.extent || srcOptions.projection.getExtent();
        var w = getWidth(extent);
        var h = getHeight(extent);
        var minRes = Math.max(w / srcOptions.tileSize[0], h / srcOptions.tileSize[1]);
        var url = this._createRequestUrl(srcOptions);

        srcOptions = $.extend(true, {}, srcOptions, {
            url: url,
            tileGrid: new WMTSTileGrid({
                extent: extent,
                origin: getTopLeft(extent),
                resolutions: this._createResolution(levels, minRes),
                matrixIds: this._createMatrixIds(levels)
            }),
            requestEncoding: 'REST',
            style: 'default'
        });

        return srcOptions;
    }
    isCombinable(other) {
        var combinable = super.isCombinable(other);
        return false;
    }
};

export default WMTS 