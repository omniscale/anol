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
        var geojsonStyle = feature.get('style');

        if(geojsonStyle === undefined || geojsonStyle === {}) {
            return defaultStyle;
        }
        if(geometryType === 'Point') {
            return new ol.style.Style({
                image: this.createImageStyle(geojsonStyle, defaultStyle.getImage())
            });
        } else {
            // line features ignores fill style
            return new ol.style.Style({
                fill: this.createFillStyle(geojsonStyle, defaultStyle.getFill()),
                stroke: this.createStrokeStyle(geojsonStyle, defaultStyle.getStroke())
            });
        }
    },
    createImageStyle: function(style, defaultImageStyle) {
        var isCircle = style.radius !== undefined;
        var isIcon = style.externalGraphic !== undefined;
        var isDefaultCircle = defaultImageStyle instanceof ol.style.Circle;
        var isDefaultIcon = defaultImageStyle instanceof ol.style.Icon;

        if(isCircle || !(isIcon && isDefaultCircle)) {
            return this.createCircleStyle(style, defaultImageStyle);
        } else if (isIcon || !(isCircle && isDefaultIcon)) {
            return this.createIconStyle(style, defaultImageStyle);
        }
        return defaultImageStyle;
    },
    createCircleStyle: function(style, defaultCircleStyle) {
        var defaultStrokeStyle = new ol.style.Stroke();
        var defaultFillStyle = new ol.style.Fill();
        if(defaultCircleStyle instanceof ol.style.Circle) {
            defaultStrokeStyle = defaultCircleStyle.getStroke();
            defaultFillStyle = defaultCircleStyle.getFill();
        }
        var radius = defaultCircleStyle.getRadius();
        if(style.radius !== undefined) {
            radius = parseFloat(style.radius);
        }
        return new ol.style.Circle({
            radius: radius,
            stroke: this.createStrokeStyle(style, defaultStrokeStyle),
            fill: this.createFillStyle(style, defaultFillStyle)
        });
    },
    createIconStyle: function(style, _defaultIconStyle) {
        var defaultIconStyle = new ol.style.Icon();
        if(_defaultIconStyle instanceof ol.style.Icon) {
            defaultIconStyle = _defaultIconStyle;
        }
        var src = defaultIconStyle.getSrc();
        if(style.externalGraphic !== undefined) {
            src = style.externalGraphic;
        }
        var rotation = defaultIconStyle.getRotation();
        if(style.rotation !== undefined) {
            rotation = parseFloat(style.rotation);
        }
        var scale = defaultIconStyle.getScale();
        if(style.scale !== undefined) {
            scale = parseFloat(style.scale);
        }

        var iconStyle = new ol.style.Icon(({
            src: src,
            rotation: rotation
        }));
        if(scale === undefined && style.graphicWidth !== undefined) {
            // get original image size
            var size = iconStyle.getSize();
            if (size !== null) {
                scale = parseInt(style.graphicWidth) / size[0];
            }
        }
        iconStyle.setScale(scale);
        return iconStyle;
    },
    createFillStyle: function(style, defaultFillStyle) {
        var color = ol.color.asArray(defaultFillStyle.getColor()).slice();
        if (style.fillColor !== undefined) {
            var fillColor = ol.color.asArray(style.fillColor);
            color[0] = fillColor[0];
            color[1] = fillColor[1];
            color[2] = fillColor[2];
        }
        if(style.fillOpacity !== undefined) {
            color[3] = parseFloat(style.fillOpacity);
        }
        return new ol.style.Fill({
            color: color
        });
    },
    createStrokeStyle: function(style, defaultStrokeStyle) {
        var color = ol.color.asArray(defaultStrokeStyle.getColor()).slice();
        var strokeWidth = defaultStrokeStyle.getWidth();
        var strokeDashstyle = defaultStrokeStyle.getLineDash();

        if(style.strokeColor !== undefined) {
            var strokeColor = ol.color.asArray(style.strokeColor);
            color[0] = strokeColor[0];
            color[1] = strokeColor[1];
            color[2] = strokeColor[2];
        }
        if(style.strokeOpacity !== undefined) {
            color[3] = parseFloat(style.strokeOpacity);
        }
        if(style.strokeWidth !== undefined) {
            strokeWidth = parseFloat(style.strokeWidth);
        }
        if(style.strokeDashstyle !== undefined) {
            strokeDashstyle = this.createDashStyle(strokeWidth, style.strokeDashstyle);
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
