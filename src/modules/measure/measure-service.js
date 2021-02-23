import './module.js';

import { Circle as CircleStyle, Fill, Stroke, Style, Text } from 'ol/style.js';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import { transform } from 'ol/proj';
import Overlay from 'ol/Overlay';
import MultiPoint from 'ol/geom/MultiPoint.js';
import { getArea as getSphereArea, getDistance } from 'ol/sphere';

angular.module('anol.measure')
    /**
     * @ngdoc object
     * @name anol.measure.MeasureServiceFactory
     */
    .factory('MeasureService', ['MapService', function (MapService) {

        function createMeasureOverlay() {
            var element = angular.element('<div></div>');
            element.addClass('anol-overlay');
            element.addClass('anol-measure-overlay');
            var overlay = new Overlay({
                element: element[0],
                offset: [0, -15],
                positioning: 'bottom-center'
            });
            return overlay;
        };

        function calculateLength(geometry, projection, geodesic) {
            if (geometry.getType() !== 'LineString') {
                return 0;
            }
            var length;
            if (geodesic) {
                var coordinates = geometry.getCoordinates();
                length = 0;
                for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                    var c1 = transform(coordinates[i], projection.getCode(), 'EPSG:4326');
                    var c2 = transform(coordinates[i + 1], projection.getCode(), 'EPSG:4326');
                    length += getDistance(c1, c2);
                }
            } else {
                length = Math.round(geometry.getLength() * 100) / 100;
            }
            return length;
        };

        function calculateArea(geometry, projection, geodesic) {
            if (geometry.getType() !== 'Polygon') {
                return 0.0;
            }
            var area;
            if (geodesic) {
                area = getSphereArea(geometry);
            } else {
                area = geometry.getArea();
            }
            return area;
        };

        function formatLineResult(geometry, projection, geodesic) {
            var length = calculateLength(geometry, projection, geodesic);
            var output;
            if (length > 1000) {
                output = anol.helper.round((length / 1000), 3) + ' ' + 'km';
            } else {
                output = anol.helper.round(length, 2) + ' ' + 'm';
            }
            output = output.replace('.', ',')
            return output;
        };

        function formatAreaResult(geometry, projection, geodesic, addCircumference) {
            var area = calculateArea(geometry, projection, geodesic);
            if (area === 0) {
                return '';
            }

            var output;
            if (area > 100000) {
                output = anol.helper.round((area / 10000), 3) +
                    ' ' + 'ha';
            } else {
                output = anol.helper.round(area, 2) +
                    ' ' + 'm<sup>2</sup>';
            }
            output = output.replace('.', ',')

            if (addCircumference) {
                // calculate line length for area and add to label
                var length = 0;
                var coordinates = geometry.getCoordinates();
                var coords = coordinates[0];
                angular.forEach(coords, function (coord, idx) {
                    if (idx !== coords.length - 1) {
                        length += calculateLength(new LineString([coord, coords[idx + 1]]));
                    }
                })
                if (length > 1000) {
                    output += '<br>' + anol.helper.round((length / 1000), 3) + ' ' + 'km';
                } else {
                    output += '<br>' + anol.helper.round(length, 2) + ' ' + 'm';
                }
                output = output.replace('.', ',')
            }

            return output;
        };

        var measureStyle = function (feature, labelSegments) {
            var geometry = feature.getGeometry();
            var styles = [
                new Style({
                    fill: new Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 0, 0.5)',
                        lineDash: [10, 10],
                        width: 2,
                        opacity: 0.5
                    }),
                    image: new CircleStyle({
                        radius: 5,
                        stroke: new Stroke({
                            color: 'rgba(0, 0, 0, 0.7)'
                        })
                    })
                })
            ];

            function lengthAsString(start, end) {
                var geometry = new LineString([start, end])
                var projection = MapService.getMap().getView().getProjection();

                var length;
                // TODO load from Service
                var geodesic = false;

                if (geodesic) {
                    var coordinates = geometry.getCoordinates();
                    length = 0;
                    for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                        var c1 = transform(coordinates[i], projection.getCode(), 'EPSG:4326');
                        var c2 = transform(coordinates[i + 1], projection.getCode(), 'EPSG:4326');
                        length += getDistance(c1, c2);
                    }
                } else {
                    length = Math.round(geometry.getLength() * 100) / 100;
                }

                var output;
                if (length > 1000) {
                    output = anol.helper.round((length / 1000), 3) + ' ' + 'km';
                } else {
                    output = anol.helper.round(length, 2) + ' ' + 'm';
                }
                output = output.replace('.', ',')
                return output;
            }

            function layoutSegments(start, end) {
                var newXY = [(end[0] + start[0]) / 2, (end[1] + start[1]) / 2];
                // text
                styles.push(new Style({
                    geometry: new Point(newXY),
                    text: new Text({
                        font: '14px Calibri,sans-serif',
                        fill: new Fill({
                            color: '#000'
                        }),
                        stroke: new Stroke({
                            color: '#fff',
                            width: 2
                        }),
                        text: lengthAsString(start, end)
                    })
                }));
                // points
                styles.push(new Style({
                    geometry: new MultiPoint([start, end]),
                    image: new CircleStyle({
                        radius: 5,
                        fill: new Fill({
                            color: 'grey'
                        })
                    })
                }));
            }

            if (labelSegments) {
                var geometryType = feature.getGeometry().getType();
                if (geometryType === 'LineString') {
                    geometry.forEachSegment(function (start, end) {
                        layoutSegments(start, end);
                    });
                }
                if (geometryType === 'Polygon') {
                    var coordinates = geometry.getCoordinates();
                    var coords = coordinates[0];
                    angular.forEach(coords, function (coord, idx) {
                        if (idx !== coords.length - 1) {
                            var start = coord;
                            var end = coords[idx + 1];
                            layoutSegments(start, end);
                        }
                    })
                }
            }
            return styles;
        };

        return {
            createMeasureOverlay: createMeasureOverlay,
            measureStyle: measureStyle,
            calculateLength: calculateLength,
            calculateArea: calculateLength,
            formatLineResult: formatLineResult,
            formatAreaResult: formatAreaResult
        };
    }]);
