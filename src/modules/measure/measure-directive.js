import './module.js';

import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Circle from 'ol/style/Circle';
import Style from 'ol/style/Style';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import Polygon from 'ol/geom/Polygon';
import Draw from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import { TOUCH as hasTouch } from 'ol/has';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { transform } from 'ol/proj';

import {getArea as getSphereArea, getDistance} from 'ol/sphere';

angular.module('anol.measure')
/**
 * @ngdoc directive
 * @name anol.measure.directive:anolLineMeasure
 *
 * @requires anol.map.MapService
 * @requires anol.map.ControlsSerivce
 * @requries anol.map.LayersService
 *
 * @param {string} anolMeasure Type of measurement. Supported values are *line* and *area*. Default: *line*
 * @param {boolean} geodesic Use geodesic measure method
 * @param {Style} style Style for drawed measures
 * @param {string} tooltipPlacement Position of tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {boolean} addToMap Create control and add to map when placed inside map. Default: true
 * @param {function} activate Pass name of function to activate control from outer scope
 * @param {function} decativate Pass name of function to deactivate control from outer scope
 * @param {function} measureResultCallback Given function is called when measure result is available
 * @param {function} activatedCallback Given function is called when control is activated
 * @param {function} deactivatedCallback Given function is called when control is deactivated
 *
 * @description
 * Point, Line or area measurement
 */
    .directive('anolMeasure', ['$templateRequest', '$compile', '$timeout', 'ControlsService', 'LayersService', 'MapService', 
        function($templateRequest, $compile, $timeout, ControlsService, LayersService, MapService) {
            // create a sphere whose radius is equal to the semi-major axis of the WGS84 ellipsoid
            // var wgs84Sphere = new ol.Sphere(6378137);
            var measureStyle = new Style({
                fill: new Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                }),
                stroke: new Stroke({
                    color: 'rgba(0, 0, 0, 0.5)',
                    lineDash: [10, 10],
                    width: 2,
                    opacity: 0.5
                }),
                image: new Circle({
                    radius: 5,
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 0, 0.7)'
                    })
                })
            });

            var calculateCoordinate = function(geometry) {
                return geometry.getCoordinates();
            };

            var calculateLength = function(geometry, projection, geodesic) {
                if(geometry.getType() !== 'LineString') {
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

            var calculateArea = function(geometry, projection, geodesic) {
                if(geometry.getType() !== 'Polygon') {
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

            var formatCoordinateResult = function(geometry, projection) {
                var coord = transform(geometry.getCoordinates(),
                    projection.getCode(),
                    'EPSG:4326');
                var output = '';
                output += coord[0] + ' lat | ';
                output += coord[1] + ' lon';
                return output;
            };

            var formatLineResult = function(geometry, projection, geodesic) {
                var length = calculateLength(geometry, projection, geodesic);
                var output;
                if (length > 100) {
                    output = (Math.round(length / 1000 * 100) / 100) + ' ' + 'km';
                } else {
                    output = (Math.round(length * 100) / 100) + ' ' + 'm';
                }
                return output;
            };

            var formatAreaResult = function(geometry, projection, geodesic) {
                var area = calculateArea(geometry, projection, geodesic);
                var output;
                if (area > 10000) {
                    output = (Math.round(area / 10000 * 100) / 100) +
                     ' ' + 'ha';
                } else {
                    output = Math.round(area) +
                     ' ' + 'm<sup>2</sup>';
                }
                return output;
            };

            var handlePointMeasure = function(geometry, coordinate) {
                return new Point(coordinate);
            };

            var handleLineMeasure = function(geometry, coordinate) {
                switch(geometry.getType()) {
                case 'Point':
                    return new LineString([
                        geometry.getCoordinates(),
                        coordinate
                    ]);
                case 'LineString':
                    var coords = geometry.getCoordinates();
                    coords.push(coordinate);
                    return new LineString(coords);
                }
            };

            var handleAreaMeasure = function(geometry, coordinate) {
                var coords;
                switch(geometry.getType()) {
                case 'Point':
                    return new LineString([
                        geometry.getCoordinates(),
                        coordinate
                    ]);
                case 'LineString':
                    coords = geometry.getCoordinates();
                    coords.push(coordinate);
                    coords.push(coords[0]);
                    return new Polygon([coords]);
                case 'Polygon':
                    coords = geometry.getCoordinates()[0];
                    coords.splice(coords.length - 1, 0, coordinate);
                    return new Polygon([coords]);
                }
            };

            var createMeasureOverlay = function() {
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

            var createModifyInteraction = function(measureSource, measureType, measureOverlay, measureResultCallback, projection, geodesic) {
                var modify = new Modify({
                    features: measureSource.getFeaturesCollection()
                });
                modify.on('modifyend', function() {
                    var resultFormatter, resultCalculator;
                    switch(measureType) {
                    case 'point':
                        resultCalculator = calculateCoordinate;
                        resultFormatter = formatCoordinateResult;
                        break;
                    case 'line':
                        resultCalculator = calculateLength;
                        resultFormatter = formatLineResult;
                        break;
                    case 'area':
                        resultCalculator = calculateArea;
                        resultFormatter = formatAreaResult;
                        break;
                    }
                    var geometry = measureSource.getFeatures()[0].getGeometry();

                    if(angular.isFunction(measureResultCallback)) {
                        measureResultCallback({
                            type: measureType,
                            value: resultCalculator(geometry, projection, geodesic)
                        });
                        return;
                    }

                    measureOverlay.getElement().innerHTML = resultFormatter(geometry, projection, geodesic);
                    measureOverlay.setPosition(geometry.getLastCoordinate());
                });
                return modify;
            };

            var createDrawInteraction = function(measureSource, measureType, measureOverlay, measureResultCallback, projection, geodesic) {
                var draw = new Draw({
                    type: 'Point',
                    style: new Style({})
                });

                draw.on('drawstart',
                    function(evt) {
                        var sketch = evt.feature;

                        /** @type {ol.Coordinate|undefined} */
                        var coord = evt.coordinate;
                        measureOverlay.setPosition(coord);

                        var geometryCreator;
                        var resultCalculator;
                        var resultFormatter;
                        switch(measureType) {
                        case 'point':
                            geometryCreator = handlePointMeasure;
                            resultCalculator = calculateCoordinate;
                            resultFormatter = formatCoordinateResult;
                            break;
                        case 'line':
                            geometryCreator = handleLineMeasure;
                            resultCalculator = calculateLength;
                            resultFormatter = formatLineResult;
                            break;
                        case 'area':
                            geometryCreator = handleAreaMeasure;
                            resultCalculator = calculateArea;
                            resultFormatter = formatAreaResult;
                            break;
                        }

                        var features = measureSource.getFeatures();
                        if(features.length === 0) {
                            measureSource.addFeature(sketch);
                            if(angular.isFunction(measureResultCallback)) {
                                measureResultCallback({
                                    type: measureType,
                                    value: resultCalculator(sketch.getGeometry(), projection, geodesic)
                                });
                            }
                            return;
                        }

                        var newGeometry = geometryCreator(features[0].getGeometry(),
                            sketch.getGeometry().getCoordinates());
                        features[0].setGeometry(newGeometry);

                        if(angular.isFunction(measureResultCallback)) {
                            measureResultCallback({
                                type: measureType,
                                value: resultCalculator(newGeometry, projection, geodesic)
                            });
                            return;
                        }

                        measureOverlay.getElement().innerHTML = resultFormatter(newGeometry, projection, geodesic);
                        measureOverlay.setPosition(newGeometry.getLastCoordinate());
                    }, this
                );
                return draw;
            };

            return {
                restrict: 'A',
                require: '?^anolMap',
                replace: true,
                scope: {
                    measureType: '@anolMeasure',
                    geodesic: '@',
                    style: '=?',
                    tooltipPlacement: '@',
                    tooltipDelay: '@',
                    tooltipEnable: '@',
                    addToMap: '@?',
                    activate: '=?',
                    deactivate: '=?',
                    measureResultCallback: '=?',
                    activatedCallback: '=?',
                    deactivatedCallback: '=?',
                    title: '@'
                },
                template: function() {
                    return require('./templates/measure.html');
                },
                link: function(scope, element, attrs, AnolMapController) {
                    //attribute defaults
                    scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
                        scope.tooltipPlacement : 'right';
                    scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                        scope.tooltipDelay : 500;
                    scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                        scope.tooltipEnable : !hasTouch;
                    scope.geodesic = scope.geodesic === true || scope.geodesic === 'true';
                    var control;

                    // create layer to draw in
                    var measureSource = new VectorSource({
                        useSpatialIndex: false
                    });
                    var _measureLayer = new VectorLayer({
                        source: measureSource,
                        style: scope.style || measureStyle,
                        zIndex: 2000
                    });

                    var layerOptions = {
                        title: 'lineMeasureLayer',
                        name: 'lineMeasureLayer',
                        displayInLayerswitcher: false,
                        olLayer: _measureLayer
                    };

                    var map = MapService.getMap();

                    var measureOverlay = createMeasureOverlay();

                    var draw = createDrawInteraction(measureSource,
                        scope.measureType,
                        measureOverlay,
                        scope.measureResultCallback,
                        map.getView().getProjection(),
                        scope.geodesic);

                    var modify = createModifyInteraction(measureSource,
                        scope.measureType,
                        measureOverlay,
                        scope.measureResultCallback,
                        map.getView().getProjection(),
                        scope.geodesic);

                    scope.measure = function() {
                        if(control.active) {
                            control.deactivate();
                        } else {
                            control.activate();
                        }
                    };

                    var deactivate = function() {
                        map.removeInteraction(draw);
                        map.removeInteraction(modify);
                        measureSource.clear();
                        map.removeOverlay(measureOverlay);
                        measureOverlay.getElement().innerHTML = '';
                        if(angular.isFunction(scope.deactivatedCallback)) {
                            scope.deactivatedCallback();
                        }
                    };

                    var activate = function() {
                        map.addInteraction(draw);
                        map.addInteraction(modify);
                        map.addOverlay(measureOverlay);
                        if(angular.isFunction(scope.activatedCallback)) {
                            scope.activatedCallback();
                        }
                    };

                    scope.deactivate = function() {
                        control.deactivate();
                    };

                    scope.activate = function() {
                        control.activate();
                    };

                    LayersService.addSystemLayer(new anol.layer.Layer(layerOptions), 0);

                    if(AnolMapController === null || scope.addToMap === false || scope.addToMap === 'false') {
                        control = new anol.control.Control({
                            exclusive: true,
                            olControl: null
                        });
                    } else {
                        element.addClass('ol-control');
                        element.addClass('anol-measure-' + scope.measureType);
                        control = new anol.control.Control({
                            element: element,
                            exclusive: true
                        });
                    }

                    control.onDeactivate(deactivate);
                    control.onActivate(activate);
                    ControlsService.addControl(control);
                }
            };
        }]);
