angular.module('anol.measure')

/**
 * @ngdoc directive
 * @name anol.measure.anolLineMeasure
 *
 * @requires $compile
 * @requires anol.map.MapService
 * @requires anol.map.ControlsSerivce
 * @requries anol.map.LayersService
 * @requires anol.map.InteractionsService
 *
 * @param {string} anolMeasure Type of measurement. Supported values are *line* and *area*. Default: *line*
 * @param {boolean} geodesic Use geodesic measure method
 * @param {ol.style.Style} drawStyle Style for lines while drawing
 * @param {ol.style.Style} style Style for drawed lines
 *
 * @description
 * Line measurement
 */
.directive('anolMeasure', ['$compile', 'ControlsService', 'LayersService', 'InteractionsService', 'MapService',
    function($compile, ControlsService, LayersService, InteractionsService, MapService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        scope: {
            measureType: '@anolMeasure',
            geodesic: '@',
            drawStyle: '=',
            style: '='
        },
        link: function(scope, element, attrs) {
            var measureOverlay, listener, control;

            // create a sphere whose radius is equal to the semi-major axis of the WGS84 ellipsoid
            var wgs84Sphere = new ol.Sphere(6378137);

            var drawStyle = scope.drawStyle || new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2
                }),
                image: new ol.style.Circle({
                    radius: 5,
                    stroke: new ol.style.Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    })
                })
            });

            var lineStyle = scope.style || new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: '#ffcc33',
                    width: 2
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
            });

            // create layer to draw in
            var _measureSource = new ol.source.Vector();
            var _measureLayer = new ol.layer.Vector({
                source: _measureSource,
                style: lineStyle
            });

            var layerOptions = {
                title: 'lineMeasureLayer',
                name: 'lineMeasureLayer',
                displayInLayerswitcher: false,
                olLayer: _measureLayer
            };

            var formatLength = function(line) {
              var length;
              if (scope.geodesic) {
                var coordinates = line.getCoordinates();
                length = 0;
                var sourceProj = map.getView().getProjection();
                for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                  var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
                  var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
                  length += wgs84Sphere.haversineDistance(c1, c2);
                }
              } else {
                length = Math.round(line.getLength() * 100) / 100;
              }
              var output;
              if (length > 100) {
                output = (Math.round(length / 1000 * 100) / 100) +
                    ' ' + 'km';
              } else {
                output = (Math.round(length * 100) / 100) +
                    ' ' + 'm';
              }
              return output;
            };

            var formatArea = function(polygon) {
                var area;
                if (scope.geodesic) {
                    var sourceProj = map.getView().getProjection();
                    var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(
                        sourceProj, 'EPSG:4326'));
                    var coordinates = geom.getLinearRing(0).getCoordinates();
                    area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
                } else {
                    area = polygon.getArea();
                }
                var output;
                if (area > 10000) {
                    output = (Math.round(area / 1000000 * 100) / 100) +
                             ' ' + 'km<sup>2</sup>';
                } else {
                    output = (Math.round(area * 100) / 100) +
                             ' ' + 'm<sup>2</sup>';
              }
              return output;
            };

            var createMeasureOverlay = function() {
                var element = angular.element('<div></div>');
                element.addClass('anol-overlay');
                element.addClass('anol-measure-line-dynamic-overlay');
                var overlay = new ol.Overlay({
                    element: element[0],
                    offset: [0, -15],
                    positioning: 'bottom-center'
                });
                return overlay;
            };

            var createDrawInteraction = function(drawStyle) {
                var sketch;
                // create draw interaction
                var draw = new ol.interaction.Draw({
                    source: _measureSource,
                    type: scope.measureType === 'area' ? 'Polygon' : 'LineString',
                    style: drawStyle
                });

                // when draw finished,
                draw.on('drawstart',
                    function(evt) {
                        sketch = evt.feature;
                        var toRemove = [];
                        _measureSource.forEachFeature(function(feature) {
                            if(feature !== sketch) {
                                toRemove.push(feature);
                            }
                        });
                        angular.forEach(toRemove, function(feature) {
                            _measureSource.removeFeature(feature);
                        });

                        if(measureOverlay === undefined) {
                            measureOverlay = createMeasureOverlay();
                            map.addOverlay(measureOverlay);
                        } else {
                            var measureOverlayElement = angular.element(measureOverlay.getElement());
                            measureOverlayElement.removeClass('anol-measure-line-static-overlay');
                            measureOverlayElement.addClass('anol-measure-line-dynamic-overlay');
                        }

                        /** @type {ol.Coordinate|undefined} */
                        var coord = evt.coordinate;
                        measureOverlay.setPosition(coord);

                        listener = sketch.getGeometry().on('change', function(evt) {
                            var geom = evt.target;
                            var output = scope.measureType === 'area' ? formatArea(geom) : formatLength(geom);
                            coord = geom.getLastCoordinate();
                            measureOverlay.getElement().innerHTML = output;
                            measureOverlay.setPosition(coord);
                        });
                    }, this
                );

                draw.on('drawend',
                    function(evt) {
                        // unset sketch
                        sketch = null;
                        var measureOverlayElement = angular.element(measureOverlay.getElement());
                        measureOverlayElement.removeClass('anol-measure-line-dynamic-overlay');
                        measureOverlayElement.addClass('anol-measure-line-static-overlay');

                        // unset tooltip so that a new one can be created
                        ol.Observable.unByKey(listener);
                    }, this
                );

                return draw;
            };

            scope.measure = function() {
                var active = control.get('active');
                if(active) {
                    deactivate();
                } else {
                    map.addInteraction(draw);
                    control.set('active', true);
                }

            };

            var deactivate = function() {
                map.removeInteraction(draw);
                _measureSource.clear();
                ol.Observable.unByKey(listener);
                map.removeOverlay(measureOverlay);
                measureOverlay = undefined;
                control.set('active', false);
            };

            scope.geodesic = scope.geodesic === true || scope.geodesic === 'true';

            var map = MapService.getMap();

            LayersService.addLayer(new anol.layer.Layer(layerOptions));

            var draw = createDrawInteraction(drawStyle);

            element.addClass('ol-control');
            element.addClass(scope.measureType === 'area' ? 'anol-measure-area' : 'anol-measure-line');

            // create button
            var button = angular.element('<button ng-click="measure()"></button>');
            element.append($compile(button)(scope));

            control = new ol.control.Control({
                element: element.first().context
            });
            control.set('active', false);
            control.set('discrete', true);
            control.set('deactivate', deactivate);
            ControlsService.addControl(control);
        }
    };
}]);
