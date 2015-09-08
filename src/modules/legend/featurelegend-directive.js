angular.module('anol.legend')
/**
 * @ngdoc directive
 * @name anol.legend.directive:anolFeatureLegend
 *
 * @restrict A
 * @requires anol.map.LayersService
 *
 * @param {string=} anolFeatureLegend If containing "open" feature legend initial state is expanded. Otherweise it is collapsed.
 *
 * @description
 * Show vector symbols as legend for each vector layer with defined *geometryType*
 */
.directive('anolFeatureLegend', ['LayersService', function(LayersService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        transclude: true,
        templateUrl: 'src/modules/legend/templates/featurelegend.html',
        scope: {
            anolFeatureLegend: '@'
        },
        link: {
            pre: function(scope, element, attrs, AnolMapController) {
                scope.collapsed = false;
                scope.showToggle = false;
                if(angular.isDefined(AnolMapController)) {
                    scope.collapsed = scope.anolFeatureLegend !== 'open';
                    scope.showToggle = true;
                    element.addClass('ol-unselectable');
                    element.addClass('anol-featurelegend');
                    AnolMapController.getMap().addControl(
                        new ol.control.Control({
                            element: element.first().context
                        })
                    );
                }
            },
            post: function(scope, element, attrs) {
                var createCanvas = function() {
                    var canvas = angular.element('<canvas></canvas>');
                    canvas[0].width = 20;
                    canvas[0].height = 20;
                    return canvas;
                };
                var drawPointLegend = function(style) {
                    var canvas = createCanvas();
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
                };
                var drawLineLegend = function(style) {
                    var canvas = createCanvas();
                    var ctx = canvas[0].getContext('2d');

                    ctx.moveTo(3, 10);
                    ctx.lineTo(17, 10);
                    ctx.strokeStyle = style.getStroke().getColor();
                    ctx.lineWidth = style.getStroke().getWidth();
                    ctx.stroke();
                    return canvas;
                };
                var drawPolygonLegend = function(style) {
                    var canvas = createCanvas();
                    var ctx = canvas[0].getContext('2d');

                    ctx.rect(3, 3, 14, 14);
                    ctx.fillStyle = style.getFill().getColor();
                    ctx.strokeStyle = style.getStroke().getColor();
                    ctx.lineWidth = style.getStroke().getWidth();
                    ctx.fill();
                    ctx.stroke();
                    return canvas;
                };

                var createLegendEntry = function(title, type, style) {
                    if(angular.isFunction(style)) {
                        style = style()[0];
                    }
                    var container = angular.element('<div></div>');
                    switch(type) {
                        case 'point':
                            container.append(drawPointLegend(style));
                        break;
                        case 'line':
                            container.append(drawLineLegend(style));
                        break;
                        case 'polygon':
                            container.append(drawPolygonLegend(style));
                        break;
                        default:
                    }

                    var titleElement = angular.element('<span></span>');
                    titleElement.text(title);
                    container.append(titleElement);
                    element.find('.legend-items').append(container);
                };
                angular.forEach(LayersService.layers, function(_layer) {
                    var layers = [_layer];
                    if(_layer instanceof anol.layer.Group) {
                        layers = _layer.layers;
                    }
                    angular.forEach(layers, function(layer) {
                        if(layer.olLayer instanceof ol.layer.Vector) {
                            createLegendEntry(layer.title, layer.geometryType, layer.olLayer.getStyle());
                        }
                    });
                });
            }
        }
    };
}]);
