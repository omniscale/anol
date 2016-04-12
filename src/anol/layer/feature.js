/**
 * @ngdoc object
 * @name anol.layer.Feature
 *
 * @param {Object} options AnOl Layer options
 * @param {Object} options.olLayer Options for ol.layer.Vector
 * @param {Object} options.olLayer.source Options for ol.source.Vector
 *
 * @description
 * Inherits from {@link anol.layer.Layer anol.layer.Layer}.
 */
 anol.layer.Feature = function(_options) {
    if(_options === false) {
        anol.layer.Layer.call(this, _options);
        return;
    }
    var self = this;
    var defaults = {};
    var options = $.extend({}, defaults, _options );

    this.hasStyleFunction = angular.isFunction(options.olLayer.style);

    this.style = options.style;
    this.minResolution = (options.style || {}).minResolution;
    this.maxResolution = (options.style || {}).maxResolution;
    this.hasPropertyLabel = (options.style || {}).propertyLabel !== undefined;

    this.externalGraphicPrefix = options.externalGraphicPrefix;
    this.hasPropertyLabel = false;

    this.isVector = true;
    this.loaded = true;
    this.saveable = options.saveable || false;
    this.editable = options.editable || false;

    anol.layer.Layer.call(this, options);
};
anol.layer.Feature.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.Feature.prototype, {
    CLASS_NAME: 'anol.layer.Feature',
    OL_LAYER_CLASS: ol.layer.Vector,
    OL_SOURCE_CLASS: ol.source.Vector,
    DEFAULT_FONT_FACE: 'Helvetica',
    DEFAULT_FONT_SIZE: '10px',
    DEFAULT_FONT_WEIGHT: 'normal',
    setOlLayer: function(olLayer) {
        var self = this;
        anol.layer.Layer.prototype.setOlLayer.call(this, olLayer);
        // if the layer has an own style function we don't create an style object
        if(!this.hasStyleFunction) {
            var defaultStyle = angular.isFunction(olLayer.getStyle()) ? olLayer.getStyle()()[0] : olLayer.getStyle();

            if(this.style !== undefined) {
                var createImageStyleFunction = this.style.externalGraphic !== undefined ? this.createIconStyle : this.createCircleStyle;

                this.defaultStyle = new ol.style.Style({
                    image: createImageStyleFunction.call(this, this.style, defaultStyle.getImage()),
                    fill: this.createFillStyle(this.style, defaultStyle.getFill()),
                    stroke: this.createStrokeStyle(this.style, defaultStyle.getStroke()),
                    text: this.createTextStyle(this.style, defaultStyle.getText())
                });
            } else {
                this.defaultStyle = defaultStyle;
            }

            olLayer.setStyle(function(feature, resolution) {
                return [self.createStyle(feature, resolution)];
            });
        }
    },
    isCombinable: function() {
        return false;
    },
    extent: function() {
        var extent = this.olLayer.getSource().getExtent();
        if(ol.extent.isEmpty(extent)) {
            return false;
        }
        return extent;
    },
    createStyle: function(feature, resolution) {
        var defaultStyle = angular.isFunction(this.defaultStyle) ?
            this.defaultStyle(feature, resolution)[0] : this.defaultStyle;
        if(feature === undefined) {
            return defaultStyle;
        }
        var geometryType = feature.getGeometry().getType();
        var featureStyle = feature.get('style') || {};
        if(
            angular.equals(featureStyle, {}) &&
            !this.hasPropertyLabel &&
            this.minResolution === undefined &&
            this.maxResolution === undefined
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
            return new ol.style.Style();
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
        return new ol.style.Style(styleOptions);
    },
    createImageStyle: function(style, defaultImageStyle) {
        var radius = style.radius;
        var externalGraphic = style.externalGraphic;

        var isCircle = radius !== undefined;
        var isIcon = externalGraphic !== undefined;
        var isDefaultCircle = defaultImageStyle instanceof ol.style.Circle;
        var isDefaultIcon = defaultImageStyle instanceof ol.style.Icon;

        if (isIcon || (!isCircle && isDefaultIcon)) {
            return this.createIconStyle(style, defaultImageStyle);
        } else if(isCircle || (!isIcon && isDefaultCircle)) {
            return this.createCircleStyle(style, defaultImageStyle);
        }
        return defaultImageStyle;
    },
    createCircleStyle: function(style, defaultCircleStyle) {
        var defaultStrokeStyle = new ol.style.Stroke();
        var defaultFillStyle = new ol.style.Fill();
        var radius;
        if(defaultCircleStyle instanceof ol.style.Circle) {
            defaultStrokeStyle = defaultCircleStyle.getStroke();
            defaultFillStyle = defaultCircleStyle.getFill();
            radius = defaultCircleStyle.getRadius();
        }

        var _radius = style.radius;
        if(_radius !== undefined) {
            radius = parseFloat(_radius);
        }
        return new ol.style.Circle({
            radius: radius,
            stroke: this.createStrokeStyle(style, defaultStrokeStyle),
            fill: this.createFillStyle(style, defaultFillStyle)
        });
    },
    createIconStyle: function(style, defaultIconStyle) {
        var styleOptions = {};

        if(defaultIconStyle instanceof ol.style.Icon) {
            styleOptions.src = defaultIconStyle.getSrc();
            styleOptions.rotation = defaultIconStyle.getRotation();
            styleOptions.scale = defaultIconStyle.getScale();
            styleOptions.size = defaultIconStyle.getSize();
            styleOptions.imgSize = defaultIconStyle.getSize();
        }

        if(style.externalGraphic !== undefined) {
            if(this.externalGraphicPrefix !== undefined) {
                styleOptions.src = this.externalGraphicPrefix + style.externalGraphic;
            } else {
                styleOptions.src = style.externalGraphic;
            }

        }

        if(style.graphicRotation !== undefined) {
            styleOptions.rotation = parseFloat(style.graphicRotation);
        }

        if(style.graphicWidth !== undefined && style.graphicHeight !== undefined) {
            styleOptions.size = [
                parseInt(style.graphicWidth),
                parseInt(style.graphicHeight)
            ];
            styleOptions.imgSize = [
                parseInt(style.graphicWidth),
                parseInt(style.graphicHeight)
            ];
        }

        if(style.graphicColor !== undefined) {
            styleOptions.color = style.graphicColor;
        }

        var anchor = [0.5, 0.5];
        if(style.graphicXAnchor !== undefined) {
            anchor[0] = parseInt(style.graphicXAnchor);
            styleOptions.anchorXUnits = 'pixel';
        }
        if(style.graphicYAnchor !== undefined) {
            anchor[1] = parseInt(style.graphicYAnchor);
            styleOptions.anchorYUnits = 'pixel';
        }
        styleOptions.anchor = anchor;

        if(style.graphicScale !== undefined) {
            styleOptions.scale = parseFloat(style.graphicScale);
        }

        return new ol.style.Icon(styleOptions);
    },
    createFillStyle: function(style, defaultFillStyle) {
        var color = ol.color.asArray(defaultFillStyle.getColor()).slice();
        var fillColor = style.fillColor;
        if (fillColor !== undefined) {
            fillColor = ol.color.asArray(fillColor);
            color[0] = fillColor[0];
            color[1] = fillColor[1];
            color[2] = fillColor[2];
        }
        var fillOpacity = style.fillOpacity;
        if(fillOpacity !== undefined) {
            color[3] = parseFloat(fillOpacity);
        }
        return new ol.style.Fill({
            color: color
        });
    },
    createStrokeStyle: function(style, defaultStrokeStyle) {
        var color = ol.color.asArray(defaultStrokeStyle.getColor()).slice();
        var strokeWidth = defaultStrokeStyle.getWidth();
        var strokeDashstyle = defaultStrokeStyle.getLineDash();

        var strokeColor = style.strokeColor;
        if(strokeColor !== undefined) {
            strokeColor = ol.color.asArray(strokeColor);
            color[0] = strokeColor[0];
            color[1] = strokeColor[1];
            color[2] = strokeColor[2];
        }
        var strokeOpacity = style.strokeOpacity;
        if(strokeOpacity !== undefined) {
            color[3] = parseFloat(strokeOpacity);
        }
        var _strokeWidth = style.strokeWidth;
        if(_strokeWidth !== undefined) {
            strokeWidth = parseFloat(_strokeWidth);
        }
        var _strokeDashstyle = style.strokeDashstyle;
        if(_strokeDashstyle !== undefined) {
            strokeDashstyle = this.createDashStyle(strokeWidth, _strokeDashstyle);
        }

        return new ol.style.Stroke({
            color: color,
            width: strokeWidth,
            lineDash: strokeDashstyle,
            lineJoin: 'round'
        });
    },
    // Taken from OpenLayers 2.13.1
    // see https://github.com/openlayers/openlayers/blob/release-2.13.1/lib/OpenLayers/Renderer/SVG.js#L391
    createDashStyle: function(strokeWidth, strokeDashstyle) {
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
    },
    // return function for labelKey from feature if feature is undefined
    // used for default layer style
    getLabel: function(feature, labelKey) {
        if(feature === undefined) {
            return function(_feature) {
                if(_feature === undefined) {
                    return '';
                }
                return _feature.get(labelKey);
            };
        }
        return feature.get(labelKey);
    },
    createTextStyle: function(style, defaultTextStyle, feature) {
        var fontWeight = this.DEFAULT_FONT_WEIGHT;
        var fontFace = this.DEFAULT_FONT_FACE;
        var fontSize = this.DEFAULT_FONT_SIZE;
        var defaultText;
        var defaultTextFillStyle;

        // atm defaultTextStyle is null
        if(defaultTextStyle !== null) {
            var splittedFont = defaultTextStyle.getFont().split(' ');
            fontWeight = splittedFont[0];
            fontSize = splittedFont[1];
            fontFace = splittedFont[2];
            defaultTextFillStyle = defaultTextStyle.getFill();
            defaultText = defaultTextStyle.getText();
            if(angular.isFunction(defaultText) && feature !== undefined) {
                defaultText = defaultText.call(this, feature);
            }
        }
        var styleOptions = {};
        if(style.text !== undefined) {
            styleOptions.text = style.text;
        } else if(style.propertyLabel !== undefined) {
            styleOptions.text = this.getLabel(feature, style.propertyLabel);
        } else if(defaultText !== undefined) {
            styleOptions.text = defaultText;
        }
        if(styleOptions.text === undefined && feature !== undefined) {
            return;
        }
        if(style.fontWeight !== undefined) {
            fontWeight = style.fontWeight;
        }
        if(style.fontSize !== undefined) {
            fontSize = style.fontSize;
        }
        if(style.fontFace !== undefined) {
            fontFace = style.fontFace;
        }
        styleOptions.font = [fontWeight, fontSize, fontFace].join(' ');

        var fontColor = [];
        if(defaultTextFillStyle !== undefined && defaultTextFillStyle !== null) {
            var defaultFontColor = defaultTextFillStyle.getColor();
            if(defaultFontColor !== undefined) {
                fontColor = ol.color.asArray(defaultFontColor).slice();
            }
        }
        if(style.fontColor !== undefined) {
            var _fontColor = ol.color.asArray(style.fontColor).slice();
            if(_fontColor !== undefined) {
                fontColor[0] = _fontColor[0];
                fontColor[1] = _fontColor[1];
                fontColor[2] = _fontColor[2];
                fontColor[3] = _fontColor[3] || fontColor[3] || 1;
            }
        }
        if(fontColor !== undefined && fontColor.length === 4) {
            styleOptions.fill = new ol.style.Fill({
                color: fontColor
            });
        }
        if(Object.keys(styleOptions).length > 0) {
            return new ol.style.Text(styleOptions);
        }
        return undefined;
    }
    // TODO add getProperties method including handling of hidden properties like style
    // TODO add hasProperty method
});
