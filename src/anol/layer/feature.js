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
    var options = $.extend({},
        anol.layer.Layer.prototype.DEFAULT_OPTIONS,
        defaults,
        _options
    );
    options.olLayer.source = new ol.source.Vector(
        this._createSourceOptions(options.olLayer.source)
    );

    options.olLayer = new ol.layer.Vector(options.olLayer);

    anol.layer.Layer.call(this, options);

    this.style = options.style || {};
    this.defaultStyle = this.olLayer.getStyle();
    this.olLayer.setStyle(function(feature) {
        return [self.createStyle(feature)];
    });

    this.isVector = true;
    this.loaded = true;
    this.saveable = options.saveable || false;
    this.editable = options.editable || false;
};
anol.layer.Feature.prototype = new anol.layer.Layer(false);
$.extend(anol.layer.Feature.prototype, {
    CLASS_NAME: 'anol.layer.Feature',
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
        if(angular.equals(featureStyle, {}) && angular.equals(this.style, {})) {
            return defaultStyle;
        }
        if(geometryType === 'Point') {
            return new ol.style.Style({
                image: this.createImageStyle(featureStyle, defaultStyle.getImage())
            });
        } else {
            // line features ignores fill style
            return new ol.style.Style({
                fill: this.createFillStyle(featureStyle, defaultStyle.getFill()),
                stroke: this.createStrokeStyle(featureStyle, defaultStyle.getStroke())
            });
        }
    },
    createImageStyle: function(style, defaultImageStyle) {
        var radius = style.radius || this.style.radius;
        var externalGraphic = style.externalGraphic || this.style.externalGraphic;

        var isCircle = radius !== undefined;
        var isIcon = externalGraphic !== undefined;
        var isDefaultCircle = defaultImageStyle instanceof ol.style.Circle;
        var isDefaultIcon = defaultImageStyle instanceof ol.style.Icon;


        if(isCircle || (!isIcon && isDefaultCircle)) {
            return this.createCircleStyle(style, defaultImageStyle);
        } else if (isIcon || (!isCircle && isDefaultIcon)) {
            return this.createIconStyle(style, defaultImageStyle);
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

        var _radius = style.radius || this.style.radius;
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
        var src;
        var rotation;
        var scale;
        var size;
        if(defaultIconStyle instanceof ol.style.Icon) {
            src = defaultIconStyle.getSrc();
            rotation = defaultIconStyle.getRotation();
            scale = defaultIconStyle.getScale();
            size = defaultIconStyle.getSize();
        }
        var externalGraphic = style.externalGraphic || this.style.externalGraphic;
        if(externalGraphic !== undefined) {
            src = externalGraphic;
        }
        var _rotation = style.rotation || this.style.rotation;
        if(_rotation !== undefined) {
            rotation = parseFloat(_rotation);
        }

        var graphicWidth = style.graphicWidth || this.style.graphicWidth;
        var graphicHeight = style.graphicHeight || this.style.graphicHeight;
        if(graphicWidth !== undefined && graphicHeight !== undefined) {
            size = [
                parseInt(graphicWidth),
                parseInt(graphicHeight)
            ];
        }

        var iconStyleConf = {
            src: src,
            rotation: rotation,
            size: size
        };

        var iconStyle = new ol.style.Icon(iconStyleConf);

        var _scale = style.scale || this.style.scale;
        if(_scale !== undefined) {
            scale = parseFloat(_scale);
        }
        if(scale === undefined && graphicWidth !== undefined) {
            if (size !== null) {
                scale = parseInt(graphicWidth) / size[0];
            }
        }
        if(scale !== undefined && scale !== 1) {
            iconStyle.setScale(scale);
        }
        return iconStyle;
    },
    createFillStyle: function(style, defaultFillStyle) {
        var color = ol.color.asArray(defaultFillStyle.getColor()).slice();
        var fillColor = style.fillColor || this.style.fillColor;
        if (fillColor !== undefined) {
            fillColor = ol.color.asArray(fillColor);
            color[0] = fillColor[0];
            color[1] = fillColor[1];
            color[2] = fillColor[2];
        }
        var fillOpacity = style.fillOpacity || this.style.fillOpacity;
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

        var strokeColor = style.strokeColor || this.style.strokeColor;
        if(strokeColor !== undefined) {
            strokeColor = ol.color.asArray(strokeColor);
            color[0] = strokeColor[0];
            color[1] = strokeColor[1];
            color[2] = strokeColor[2];
        }
        var strokeOpacity = style.strokeOpacity || this.style.strokeOpacity;
        if(strokeOpacity !== undefined) {
            color[3] = parseFloat(strokeOpacity);
        }
        var _strokeWidth = style.strokeWidth || this.style.strokeWidth;
        if(_strokeWidth !== undefined) {
            strokeWidth = parseFloat(_strokeWidth);
        }
        var _strokeDashstyle = style.strokeDashstyle || this.style.strokeDashstyle;
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
    }
    // TODO add getProperties method including handling of hidden properties like style
    // TODO add hasProperty method
});
