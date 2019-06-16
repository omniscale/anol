/**
 * @ngdoc object
 * @name anol.layer.Layer
 *
 * @param {Object} options AnOl Layer options
 * @param {string} options.title Layer title
 * @param {string} options.displayInLayerswitcher Show in layerswitcher
 * @param {boolean} options.permalink Add layer to permalink url. Default true. When displayInLayerswitcher is false, permalink is always false.
 * @param {boolean} options.isBackgorund Define layer as background layer
 * @param {Object} options.featureinfo Stores informations for feature info
 * @param {string} options.featureinfo.target Target of *GetFeatureInfo* request for {@link api/anol.featureinfo anol.featureinfo}. Supported values are:
 * - *_popup* - Results displayed in a popup
 * - *_blank* - Results displayed in a new window/tab
 * - *[id]* - Id of html element to display results in
 * @param {Array<string>} options.featureinfo.properties List of feature properties to show in {@link api/anol.featurepopup anol.featurepopup}.
 * @param {nu,ber} options.featureinfo.featureCount FEATURE_COUNT parameter for getFeatureInfo requests
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

import BaseLayer from 'ol/layer/Base';
import Source from 'ol/source/Source';
import { DEVICE_PIXEL_RATIO } from 'ol/has';

class AnolBaseLayer {

    constructor(options) {
        if(options === false) {
            return;
        }
        this.CLASS_NAME = 'anol.layer.Layer';
        this.OL_LAYER_CLASS = undefined;
        this.OL_SOURCE_CLASS = undefined;
        this.DEFAULT_OPTIONS = {
            olLayer: {
                source: {}
            }
        };
        options = $.extend(true, {}, this.DEFAULT_OPTIONS, options);

        this.name = options.name;
        this.title = options.title;
        this.isBackground = options.isBackground || false;
        this.featureinfo = options.featureinfo || false;
        this.legend = options.legend || false;
        this.attribution = options.attribution || undefined;
        this.isVector = false;
        this.options = options;
        this.displayInLayerswitcher = anol.helper.getValue(options.displayInLayerswitcher, true);
        this._controls = [];
        this.combined = false;
        this.clusterOptions = options.cluster || false;
        this.unclusteredSource = undefined;
        this.selectClusterControl = undefined;
        
        this.catalog = options.catalog || false;
        this.catalogLayer = options.catalogLayer || false;
        this.groupLayer = false;
        this.metadataUrl = options.metadataUrl || false;

        if(this.displayInLayerswitcher === false) {
            this.permalink = false;
        } else {
            this.permalink = anol.helper.getValue(options.permalink, true);
        }

        // keep ability to create anol.layer.Layer with predefined olLayer
        // this is needed for system layers in measure/print/etc.
        if(options.olLayer instanceof BaseLayer) {
            this.olLayer = options.olLayer;
        } 
        else {
            this.olSourceOptions = this._createSourceOptions(options.olLayer.source);
            delete options.olLayer.source;
            this.olLayerOptions = options.olLayer;
            this.olLayer = undefined;
        }
    }
    setOlLayer(olLayer) {
        this.olLayer = olLayer;
    }
    removeOlLayer() {
        delete this.olLayer;
    }
    isCombinable(other) {
        if(other.CLASS_NAME !== this.CLASS_NAME) {
            return false;
        }
        return true;
    }
    isClustered() {
        return false;
    }
    getCombinedSource() {
        return undefined;
    }
    removeFromCombinedSource() {}
    getVisible() {
        if(angular.isUndefined(this.olLayer)) {
            return false;
        }
        return this.olLayer.getVisible();
    }
    setVisible(visible)  {
        this.olLayer.setVisible(visible);
        angular.element(this).triggerHandler('anol.layer.visible:change', [this]);
    }
    onVisibleChange(func, context) {
        angular.element(this).on('anol.layer.visible:change', {'context': context}, func);
    }
    offVisibleChange(func) {
        angular.element(this).off('anol.layer.visible:change', func);
    }
    refresh() {
        if(this.olLayer instanceof BaseLayer && this.olLayer.getSource() instanceof Source) {
            var source = this.olLayer.getSource();
            source.refresh();
        }
    }
    _createSourceOptions(srcOptions) {
        srcOptions = srcOptions || {};
        if(angular.isDefined(srcOptions.tilePixelRatio)) {
            srcOptions.tilePixelRatio = DEVICE_PIXEL_RATIO > 1 ? srcOptions.tilePixelRatio : 1;
        }
        return srcOptions;
    }
}

export default AnolBaseLayer;
