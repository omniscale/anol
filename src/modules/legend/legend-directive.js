angular.module('anol.legend')
/**
 * @ngdoc directive
 * @name anol.legend.directive:anolLegend
 *
 * @restrict A
 * @requires anol.map.LayersService
 * @requires anol.map.ControlsSerivce
 *
 * @param {string} anolLegend If containing "open" legend initial state is expanded. Otherweise it is collapsed.
 * @param {function} customTargetFilled
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens}
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {boolean} showInactive If true a legend item for not visible layers with legend options is also created
 *
 * @description
 * Creates legend entries based on layer.legend configuration.
 * When url is defined in layer.legend, an image with src = layer.legend.url is appended to legend.
 * The url property is available for all types of layers.
 * For vector layers layer.legend.type can be one of `point`, `line` or `polygon`. A legend entry depending on layer style is created.
 * For raster layers with defined layer.legend a legend entry with result of getLegendGraphic request is created.
 * For raster layers, if layer.legend.target points to a html element class or id, a button is rendered instead of legend image. After button pressed
 * legend image is shown in element with given id/class.
 */
.directive('anolLegend', ['LayersService', 'ControlsService', function(LayersService, ControlsService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        transclude: true,
        templateUrl: function(tElement, tAttrs) {
          var defaultUrl = 'src/modules/legend/templates/legend.html';
          return tAttrs.templateUrl || defaultUrl;
        },
        scope: {
            anolLegend: '@',
            customTargetFilled: '&',
            tooltipPlacement: '@',
            tooltipDelay: '@',
            tooltipEnable: '@',
            showInactive: '@'
        },
        link: {
            pre: function(scope, element, attrs, AnolMapController) {
                scope.collapsed = false;
                scope.showToggle = false;

                //attribute defaults
                scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
                    scope.tooltipPlacement : 'left';
                scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                    scope.tooltipDelay : 500;
                scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                    scope.tooltipEnable : !ol.has.TOUCH;
                scope.showInactive = (scope.showInactive === true || scope.showInactive === 'true');

                // get callback from wrapper function
                if(angular.isFunction(scope.customTargetFilled())) {
                    scope.customTargetCallback = scope.customTargetFilled();
                }
                if(angular.isObject(AnolMapController)) {
                    scope.collapsed = scope.anolLegend !== 'open';
                    scope.showToggle = true;
                    element.addClass('anol-legend');
                    ControlsService.addControl(
                        new anol.control.Control({
                            element: element
                        })
                    );
                }
            },
            post: function(scope, element, attrs) {
                scope.legendLayers = [];

                angular.forEach(LayersService.layers, function(_layer) {
                    var layers = [_layer];
                    if(_layer instanceof anol.layer.Group) {
                        layers = _layer.layers;
                    }
                    angular.forEach(layers, function(layer) {
                        if(layer.legend === false) {
                            return;
                        }
                        scope.legendLayers.push(layer);
                    });
                });
            }
        }
    };
}])

.directive('anolLegendImage', ['$compile', function($compile) {
    return {
        restrict: 'A',
        scope: {
            legendLayer: '=anolLegendImage',
            customTargetFilled: '&',
            prepend: '=',
        },
        link: function(scope, element, attrs) {
            var VectorLegend = {
                createCanvas: function() {
                    var canvas = angular.element('<canvas></canvas>');
                    canvas.addClass = 'anol-legend-item-image';
                    canvas[0].width = 20;
                    canvas[0].height = 20;
                    return canvas;
                },
                drawPointLegend: function(style) {
                    var canvas = VectorLegend.createCanvas();
                    var ctx = canvas[0].getContext('2d');

                    if(angular.isDefined(style.getImage().getSrc)) {
                        var img = new Image();
                        img.src = style.getImage().getSrc();
                        img.onload = function() {
                            ctx.drawImage(img, 1, 1);
                        };
                    } else {
                        ctx.arc(10, 10, 7, 0, 2 * Math.PI, false);
                        ctx.strokeStyle = style.getImage().getStroke().getColor();
                        ctx.lineWidth = style.getImage().getStroke().getWidth();
                        ctx.fillStyle = style.getImage().getFill().getColor();
                        ctx.fill();
                        ctx.stroke();
                    }
                    return canvas;
                },
                drawLineLegend: function(style) {
                    var canvas = VectorLegend.createCanvas();
                    var ctx = canvas[0].getContext('2d');

                    ctx.moveTo(3, 10);
                    ctx.lineTo(17, 10);
                    ctx.strokeStyle = style.getStroke().getColor();
                    ctx.lineWidth = style.getStroke().getWidth();
                    ctx.stroke();
                    return canvas;
                },
                drawPolygonLegend: function(style) {
                    var canvas = VectorLegend.createCanvas();
                    var ctx = canvas[0].getContext('2d');

                    ctx.rect(3, 3, 14, 14);
                    ctx.fillStyle = style.getFill().getColor();
                    ctx.strokeStyle = style.getStroke().getColor();
                    ctx.lineWidth = style.getStroke().getWidth();
                    ctx.fill();
                    ctx.stroke();
                    return canvas;
                },
                createLegendEntry: function(title, type, style) {
                    if(angular.isFunction(style)) {
                        style = style()[0];
                    }
                    switch(type) {
                        case 'point':
                            return VectorLegend.drawPointLegend(style);
                        case 'line':
                            return VectorLegend.drawLineLegend(style);
                        case 'polygon':
                            return VectorLegend.drawPolygonLegend(style);
                        default:
                            return;
                    }
                }
            };

            var RasterLegend = {
                createGetLegendGraphicUrl: function(source, params) {
                    var urls = [];
                    var baseParams = {
                        'SERVICE': 'WMS',
                        'VERSION': ol.DEFAULT_WMS_VERSION,
                        'SLD_VERSION': '1.1.0',
                        'REQUEST': 'GetLegendGraphic',
                        'FORMAT': 'image/png',
                        'LAYER': undefined
                    };
                    var url = source.getUrl();
                    var sourceParams = source.getParams();
                    var layers = sourceParams.layers || sourceParams.LAYERS || '';

                    angular.forEach(layers.split(','), function(layer) {
                        urls.push(url + $.param($.extend({}, baseParams, params, {
                            'LAYER': layer
                        })));
                    });
                    return urls;
                },
                createLegendEntry: function(layer) {
                    var urls = [];
                    var params = {};
                    if(layer.legend.verison !== undefined) {
                        params.VERSION = layer.legend.version;
                    }
                    if(layer.legend.sldVersion !== undefined) {
                        params.SLD_VERSION = layer.legend.sldVersion;
                    }
                    if(layer.legend.format !== undefined) {
                        params.FORMAT = layer.legend.format;
                    }
                    urls = RasterLegend.createGetLegendGraphicUrl(layer.olLayer.getSource(), params);

                    var legendImages = $('<div></div>');
                    angular.forEach(urls, function(url) {
                        var legendImage = $('<img>');
                        legendImage.addClass('anol-legend-item-image');
                        legendImage.attr('src', url);
                        legendImages.append(legendImage);
                    });

                    // Display in element with given id
                    if (angular.isDefined(layer.legend.target)) {
                        var target = angular.element(layer.legend.target);
                        var showLegendButton = angular.element('<button>{{ \'anol.legend.SHOW\' | translate }}</button>');
                        showLegendButton.addClass('btn');
                        showLegendButton.addClass('btn-sm');
                        showLegendButton.on('click', function() {
                            target.empty();
                            target.append(legendImages);
                            if(angular.isFunction(scope.customTargetCallback)) {
                                scope.customTargetCallback();
                            }
                        });
                        return $compile(showLegendButton)(scope);
                    // Display in legend control
                    } else {
                        return legendImages;
                    }
                }
            };

            var ImageLegend = {
                createLegendEntry: function(title, url) {
                    var legendImage = angular.element('<img>');
                    legendImage.addClass('anol-legend-item-image');
                    legendImage[0].src = url;
                    return legendImage;
                }
            };

            if(angular.isFunction(scope.customTargetFilled())) {
                scope.customTargetCallback = scope.customTargetFilled();
            }

            var legendItem;

            if(scope.legendLayer.legend.url !== undefined) {
                legendItem = ImageLegend.createLegendEntry(scope.legendLayer.title, scope.legendLayer.legend.url);
            } else if(scope.legendLayer.olLayer instanceof ol.layer.Vector) {
                legendItem = VectorLegend.createLegendEntry(
                    scope.legendLayer.title,
                    scope.legendLayer.legend.type,
                    scope.legendLayer.olLayer.getStyle()
                );
            } else {
                legendItem = RasterLegend.createLegendEntry(scope.legendLayer);
            }
            if(scope.prepend === true) {
                element.prepend(legendItem);
            } else {
                element.append(legendItem);
            }
        }
    };
}]);
