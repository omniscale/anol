/**
 * @ngdoc object
 * @name anol.layer.Feature
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 * @param {Object|Boolean} options.cluster options for clustering. When true, defaults will be used
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */

import AnolBaseLayer from '../layer.js';

import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';
import Fill from 'ol/style/Fill';
import CircleStyle from 'ol/style/Circle';
import Icon from 'ol/style/Icon';
import {asArray as colorAsArray} from 'ol/color';
import Text from 'ol/style/Text';
import Cluster from 'ol/source/Cluster';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';

import {isEmpty} from 'ol/extent.js';


class FeatureLayer extends AnolBaseLayer {
    
    constructor(_options) {
        if(_options === false) {
            super();
            return;
        }        

        var defaults = {};
        var options = $.extend({}, defaults, _options );
        super(options);

        this.style = options.style;
        this.minResolution = (options.style || {}).minResolution;
        this.maxResolution = (options.style || {}).maxResolution;
        this.hasPropertyLabel = angular.isDefined((options.style || {}).propertyLabel);

        this.externalGraphicPrefix = options.externalGraphicPrefix;
        this.hasPropertyLabel = false;

        this.loaded = true;
        this.saveable = options.saveable || false;
        this.editable = options.editable || false;
        this.clusterOptions = options.cluster || false;
        this.unclusteredSource = undefined;
        this.selectClusterControl = undefined;
        this.isVector = true;

        this.CLASS_NAME = 'anol.layer.Feature';
        this.OL_LAYER_CLASS = VectorLayer;
        this.OL_SOURCE_CLASS =  VectorSource;
        this.DEFAULT_FONT_FACE =  'Helvetica';
        this.DEFAULT_FONT_SIZE =  '10px';
        this.DEFAULT_FONT_WEIGHT = 'normal';

        // this is the default ol style. we need to define it because
        // createStyle function have to return a valid style even if
        // clusterStyle in clusterOptions is undefined
        this.DEFAULT_CLUSTERED_STYLE = new Style({
            image: new CircleStyle({
                fill: new Fill({
                    color: 'rgba(255,255,255,0.4)'
                }),
                stroke: new Stroke({
                    color: '#3399CC',
                    width: 1.25
                }),
                radius: 5
            }),
            fill: new Fill({
                color: 'rgba(255,255,255,0.4)'
            }),
            stroke: new Stroke({
                color: '#3399CC',
                width: 1.25
            })
        });

        this.DEFAULT_UNCLUSTERED_STYLE = new Style({
            image: new CircleStyle({
                radius: 5,
                stroke: new Stroke({
                    color: 'rgba(0,255,255,1)',
                    width: 1
                }),
                fill: new Fill({
                    color: 'rgba(0,255,255,0.3)'
                })
            }),
            stroke: new Stroke({
                color: 'rgba(0,255,255,1)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(0,255,255,0.3)'
            })
        });

        this.DEFAULT_SELECT_CLUSTER_STYLE = new Style({
            image: new CircleStyle({
                radius: 10,
                stroke: new Stroke({
                    color: 'rgba(255,255,0,1)',
                    width: 1
                }),
                fill: new Fill({
                    color: 'rgba(255,255,0,0.3)'
                })
            }),
            stroke: new Stroke({
                color: 'rgba(255,255,0,1)',
                width: 1
            }),
            fill: new Fill({
                color: 'rgba(255,255,0,0.3)'
            })
        });
    }   

    setOlLayer(olLayer) {
        var self = this;
        // if a style function is in layer config we don't create a style function here
        if(!angular.isFunction(self.olLayerOptions.style)) {
            var defaultStyle = olLayer.getStyle();

            if(angular.isFunction(defaultStyle)) {
                defaultStyle = defaultStyle()[0];
            }

            if(angular.isDefined(this.style)) {
                var createImageStyleFunction = angular.isDefined(this.style.externalGraphic) ? this.createIconStyle : this.createCircleStyle;

                this.defaultStyle = new Style({
                    image: createImageStyleFunction.call(this, this.style, defaultStyle.getImage()),
                    fill: this.createFillStyle(this.style, defaultStyle.getFill()),
                    stroke: this.createStrokeStyle(this.style, defaultStyle.getStroke()),
                    text: this.createTextStyle(this.style, defaultStyle.getText())
                });
            } else {
                this.defaultStyle = defaultStyle;
            }
            olLayer.setStyle(function(feature, resolution) {
                var style = self.createStyle(feature, resolution);
                if(angular.isArray(style)) {
                    return style;
                }
                return [style];
            });
        }
        if(this.isClustered()) {
            this.unclusteredSource.set('anolLayers', olLayer.getSource().get('anolLayers'));
        }
        super.setOlLayer(olLayer);
    }

    removeOlLayer() {
        if(this.isClustered()) {
            var unclusteredAnolLayers = this.unclusteredSource.get('anolLayers');
            var unclusteredIdx = unclusteredAnolLayers.indexOf(this);
            if(unclusteredIdx > -1) {
                unclusteredAnolLayers.splice(unclusteredIdx, 1);
                this.unclusteredSource.set('anolLayers', unclusteredAnolLayers);
            }
            var anolLayers = this.olLayer.getSource().get('anolLayers');
            var idx = anolLayers.indexOf(this);
            if(idx > -1) {
                anolLayers.splice(idx, 1);
                this.olLayer.getSource().set('anolLayers', anolLayers);
            }
            this.olSource.clear(true);
        }
        super.removeOlLayer(this);
    }

    isCombinable() {
        return false;
    }

    extent() {
        var extent = this.olLayer.getSource().getExtent();
        if(isEmpty(extent)) {
            return false;
        }
        return extent;
    }

    clear() {
        this.olLayer.getSource().clear();
    }

    addFeature(feature) {
        this.olLayer.getSource().addFeature(feature);
    }

    addFeatures(features) {
        this.olLayer.getSource().addFeatures(features);
    }

    getFeatures() {
        return this.olLayer.getSource().getFeatures();
    }
    createStyle(feature, resolution) {
        if(this.clusterOptions !== false && angular.isDefined(feature)) {
            // when clustering, a features have a features array containing features clustered into this feature
            // so when feature don't have features or only one we draw in normal layer style instead of cluster
            // style
            var clusteredFeatures = feature.get('features');
            if(angular.isDefined(clusteredFeatures)) {
                return this.createClusterStyle(feature);
            }
        }
        var defaultStyle = angular.isFunction(this.defaultStyle) ?
            this.defaultStyle(feature, resolution)[0] : this.defaultStyle;
        if(angular.isUndefined(feature)) {
            return defaultStyle;
        }
        var geometryType = feature.getGeometry().getType();
        var featureStyle = feature.get('style') || {};
        if(
            angular.equals(featureStyle, {}) &&
            !this.hasPropertyLabel &&
            angular.isUndefined(this.minResolution) &&
            angular.isUndefined(this.maxResolution)
        ) {
            return defaultStyle;
        }

        var minResolution = featureStyle.minResolution || this.minResolution;
        if(angular.isString(minResolution)) {
            minResolution = parseFloat(minResolution);
        }
        var maxResolution = featureStyle.maxResolution || this.maxResolution;
        if(angular.isString(maxResolution)) {
            maxResolution = parseFloat((maxResolution));
        }
        if(
            (angular.isDefined(minResolution) && minResolution > resolution) ||
            (angular.isDefined(maxResolution) && maxResolution < resolution)
        ) {
            return new Style();
        }

        var styleOptions = {};
        if(geometryType === 'Point') {
            styleOptions.image = this.createImageStyle(featureStyle, defaultStyle.getImage());
        } else {
            // line features ignores fill style
            styleOptions.fill = this.createFillStyle(featureStyle, defaultStyle.getFill());
            styleOptions.stroke = this.createStrokeStyle(featureStyle, defaultStyle.getStroke());
        }
        styleOptions.text = this.createTextStyle(featureStyle, defaultStyle.getText(), feature);
        return new Style(styleOptions);
    }
    createClusterStyle() {
        return this.DEFAULT_CLUSTERED_STYLE;
    }
    createImageStyle(style, defaultImageStyle) {
        var radius = style.radius;
        var externalGraphic = style.externalGraphic;

        var isCircle = angular.isDefined(radius);
        var isIcon = angular.isDefined(externalGraphic);
        var isDefaultCircle = defaultImageStyle instanceof CircleStyle;
        var isDefaultIcon = defaultImageStyle instanceof Icon;

        if (isIcon || (!isCircle && isDefaultIcon)) {
            return this.createIconStyle(style, defaultImageStyle);
        } else if(isCircle || (!isIcon && isDefaultCircle)) {
            return this.createCircleStyle(style, defaultImageStyle);
        }
        return defaultImageStyle;
    }
    createCircleStyle(style, defaultCircleStyle) {
        var defaultStrokeStyle = new Stroke();
        var defaultFillStyle = new Fill();
        var radius;
        if(defaultCircleStyle instanceof CircleStyle) {
            defaultStrokeStyle = defaultCircleStyle.getStroke();
            defaultFillStyle = defaultCircleStyle.getFill();
            radius = defaultCircleStyle.getRadius();
        }

        var _radius = style.radius;
        if(angular.isDefined(_radius)) {
            radius = parseFloat(_radius);
        }
        return new CircleStyle({
            radius: radius,
            stroke: this.createStrokeStyle(style, defaultStrokeStyle),
            fill: this.createFillStyle(style, defaultFillStyle)
        });
    }
    createIconStyle(style, defaultIconStyle) {
        var styleOptions = {};

        if(defaultIconStyle instanceof Icon) {
            styleOptions.src = defaultIconStyle.getSrc();
            styleOptions.rotation = defaultIconStyle.getRotation();
            styleOptions.scale = defaultIconStyle.getScale();
            styleOptions.size = defaultIconStyle.getSize();
            styleOptions.imgSize = defaultIconStyle.getSize();
        }

        if(angular.isDefined(style.externalGraphic)) {
            if(angular.isDefined(this.externalGraphicPrefix)) {
                styleOptions.src = this.externalGraphicPrefix + style.externalGraphic;
            } else {
                styleOptions.src = style.externalGraphic;
            }
        }

        if(angular.isDefined(style.graphicRotation)) {
            styleOptions.rotation = this._degreeToRad(parseFloat(style.graphicRotation));
        } else if (angular.isDefined(this.style) && angular.isDefined(this.style.graphicRotation)) {
            styleOptions.rotation = this._degreeToRad(parseFloat(this.style.graphicRotation));
        }

        if(angular.isDefined(style.graphicWidth) && angular.isDefined(style.graphicHeight)) {
            styleOptions.size = [
                parseInt(style.graphicWidth),
                parseInt(style.graphicHeight)
            ];
            styleOptions.imgSize = [
                parseInt(style.graphicWidth),
                parseInt(style.graphicHeight)
            ];
        }

        if(angular.isDefined(style.graphicColor)) {
            styleOptions.color = style.graphicColor;
        }

        if(angular.isDefined(style.anchorOrigin)) {
            styleOptions.anchorOrigin = style.anchorOrigin;
        }

        var anchor = [0.5, 0.5];
        if(angular.isDefined(style.graphicXAnchor)) {
            anchor[0] = parseFloat(style.graphicXAnchor);
            styleOptions.anchorXUnits = 'pixel';
        }
        if(angular.isDefined(style.anchorXUnits)) {
            styleOptions.anchorXUnits = style.anchorXUnits;
        }
        if(angular.isDefined(style.graphicYAnchor)) {
            anchor[1] = parseFloat(style.graphicYAnchor);
            styleOptions.anchorYUnits = 'pixel';
        }
        if(angular.isDefined(style.anchorYUnits)) {
            styleOptions.anchorYUnits = style.anchorYUnits;
        }
        styleOptions.anchor = anchor;

        if(angular.isDefined(style.graphicScale)) {
            styleOptions.scale = parseFloat(style.graphicScale);
        }
        return new Icon(styleOptions);
    }
    createFillStyle(style, defaultFillStyle) {
        var color = colorAsArray(defaultFillStyle.getColor()).slice();
        var fillColor = style.fillColor;
        if (angular.isDefined(fillColor)) {
            fillColor = colorAsArray(fillColor);
            color[0] = fillColor[0];
            color[1] = fillColor[1];
            color[2] = fillColor[2];
        }
        var fillOpacity = style.fillOpacity;
        if(angular.isDefined(fillOpacity)) {
            color[3] = parseFloat(fillOpacity);
        }
        return new Fill({
            color: color
        });
    }
    createStrokeStyle(style, defaultStrokeStyle) {
        var color = colorAsArray(defaultStrokeStyle.getColor()).slice();
        var strokeWidth = defaultStrokeStyle.getWidth();
        var strokeDashstyle = defaultStrokeStyle.getLineDash();

        var strokeColor = style.strokeColor;
        if(angular.isDefined(strokeColor)) {
            strokeColor = colorAsArray(strokeColor);
            color[0] = strokeColor[0];
            color[1] = strokeColor[1];
            color[2] = strokeColor[2];
        }
        var strokeOpacity = style.strokeOpacity;
        if(angular.isDefined(strokeOpacity)) {
            color[3] = parseFloat(strokeOpacity);
        }
        var _strokeWidth = style.strokeWidth;
        if(angular.isDefined(_strokeWidth)) {
            strokeWidth = parseFloat(_strokeWidth);
        }
        var _strokeDashstyle = style.strokeDashstyle;
        if(angular.isDefined(_strokeDashstyle)) {
            strokeDashstyle = this.createDashStyle(strokeWidth, _strokeDashstyle);
        }

        return new Stroke({
            color: color,
            width: strokeWidth,
            lineDash: strokeDashstyle,
            lineJoin: 'round'
        });
    }
    // Taken from OpenLayers 2.13.1
    // see https://github.com/openlayers/openlayers/blob/release-2.13.1/lib/OpenLayers/Renderer/SVG.js#L391
    createDashStyle(strokeWidth, strokeDashstyle) {
        var w = strokeWidth;
        var str = strokeDashstyle;
        switch (str) {
        case 'dot':
            return [1, 4 * w];
        case 'dash':
            return [4 * w, 4 * w];
        case 'dashdot':
            return [4 * w, 4 * w, 1, 4 * w];
        case 'longdash':
            return [8 * w, 4 * w];
        case 'longdashdot':
            return [8 * w, 4 * w, 1, 4 * w];
            // also matches 'solid'
        default:
            return undefined;
        }
    }
    // return function for labelKey from feature if feature is undefined
    // used for default layer style
    getLabel(feature, labelKey) {
        if(angular.isUndefined(feature)) {
            return function(_feature) {
                if(angular.isUndefined(_feature)) {
                    return '';
                }
                return _feature.get(labelKey);
            };
        }
        return feature.get(labelKey);
    }
    createTextStyle(style, defaultTextStyle, feature, label) {
        var fontWeight = this.DEFAULT_FONT_WEIGHT;
        var fontFace = this.DEFAULT_FONT_FACE;
        var fontSize = this.DEFAULT_FONT_SIZE;
        var defaultText;
        var defaultTextFillStyle;
        var defaultTextRotation;
        // atm defaultTextStyle is null
        if(defaultTextStyle !== null) {
            var splittedFont = defaultTextStyle.getFont().split(' ');
            fontWeight = splittedFont[0];
            fontSize = splittedFont[1];
            fontFace = splittedFont[2];
            defaultTextFillStyle = defaultTextStyle.getFill();
            defaultText = defaultTextStyle.getText();
            defaultTextRotation = defaultTextStyle.getRotation();
            if(angular.isFunction(defaultText) && angular.isDefined(feature)) {
                defaultText = defaultText.call(this, feature);
            }
        }
        var styleOptions = {};
        if(angular.isDefined(style.text)) {
            styleOptions.text = style.text;
        } else if(angular.isDefined(style.propertyLabel) && angular.isDefined(feature)) {
            styleOptions.text = this.getLabel(feature, style.propertyLabel);
        } else if(angular.isDefined(defaultText)) {
            styleOptions.text = defaultText;
        }
        if (angular.isDefined(label)) {
            styleOptions.text = label;
        } 
        if(angular.isUndefined(styleOptions.text) && angular.isDefined(feature)) {
            return;
        }
        if(angular.isDefined(style.fontWeight)) {
            fontWeight = style.fontWeight;
        }
        if(angular.isDefined(style.fontSize)) {
            fontSize = style.fontSize;
        }
        if(angular.isDefined(style.fontFace)) {
            fontFace = style.fontFace;
        }
        styleOptions.font = [fontWeight, fontSize, fontFace].join(' ');

        if(angular.isDefined(style.fontOffsetX)) {
            styleOptions.offsetX = style.fontOffsetX;
        }
        if(angular.isDefined(style.fontOffsetY)) {
            styleOptions.offsetY = style.fontOffsetY;
        }
        if(angular.isDefined(style.fontRotation)) {
            styleOptions.rotation = this._degreeToRad(parseFloat(style.fontRotation));
        } else if(angular.isDefined(defaultTextRotation)) {
            styleOptions.rotation = defaultTextRotation;
        }

        var fontColor = [];
        if(angular.isDefined(defaultTextFillStyle) && defaultTextFillStyle !== null) {
            var defaultFontColor = defaultTextFillStyle.getColor();
            if(angular.isDefined(defaultFontColor)) {
                fontColor = colorAsArray(defaultFontColor).slice();
            }
        }
        if(angular.isDefined(style.fontColor)) {
            var _fontColor = colorAsArray(style.fontColor).slice();
            if(angular.isDefined(_fontColor)) {
                fontColor[0] = _fontColor[0];
                fontColor[1] = _fontColor[1];
                fontColor[2] = _fontColor[2];
                fontColor[3] = _fontColor[3] || fontColor[3] || 1;
            }
        }
        if(angular.isDefined(fontColor) && fontColor.length === 4) {
            styleOptions.fill = new Fill({
                color: fontColor
            });
        }
        if(Object.keys(styleOptions).length > 0) {
            return new Text(styleOptions);
        }
        return undefined;
    }
    createClusterStyleFromDefinition(styleDefinition, defaultStyle) {
        var style = new Style({
            image: this.createImageStyle(styleDefinition, defaultStyle.getImage()),
            fill: this.createFillStyle(styleDefinition, defaultStyle.getFill()),
            stroke: this.createStrokeStyle(styleDefinition, defaultStyle.getStroke()),
            text: this.createTextStyle(styleDefinition, defaultStyle.getText())
        });
        if(styleDefinition.text === '__num_features__') {
            return function(feature) {
                style.getText().setText(feature.get('features').length.toString());
                return [style];
            };
        }
        return style;
    }
    isClustered() {
        return this.clusterOptions !== false;
    }
    _degreeToRad(degree) {
        if(degree === 0) {
            return 0;
        }
        return Math.PI * (degree / 180);
    }
    _createSourceOptions(srcOptions) {
        if(this.clusterOptions === false || angular.isUndefined(this.clusterOptions)) {
            return srcOptions;
        }
        if (angular.isUndefined(this.OL_SOURCE_CLASS)) {
            return srcOptions;
        }
        srcOptions = super._createSourceOptions(srcOptions);
        this.unclusteredSource = new this.OL_SOURCE_CLASS(srcOptions);
        this.OL_SOURCE_CLASS = Cluster;

        return {
            source: this.unclusteredSource,
            distance: 50
        };
    }
    _prepareClusterStyles(clusterOptions) {
        if(angular.isDefined(clusterOptions.clusterStyle) && !(clusterOptions.clusterStyle instanceof Style)) {
            clusterOptions.clusterStyle = this.createClusterStyleFromDefinition(clusterOptions.clusterStyle, this.DEFAULT_UNCLUSTERED_STYLE);
        }
        if(angular.isDefined(clusterOptions.selectClusterStyle) && !(clusterOptions.selectClusterStyle instanceof Style)) {
            clusterOptions.selectClusterStyle = this.createClusterStyleFromDefinition(clusterOptions.selectClusterStyle, this.DEFAULT_SELECT_CLUSTER_STYLE);
        }
        return clusterOptions;
    }
    // TODO add getProperties method including handling of hidden properties like style
    // TODO add hasProperty method
}

export default FeatureLayer;
