import './module.js';

import {Style} from 'ol/style.js';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Modify from 'ol/interaction/Modify';
import Polygon from 'ol/geom/Polygon';
import Draw from 'ol/interaction/Draw';
import { TOUCH as hasTouch } from 'ol/has';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { transform } from 'ol/proj';

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
    .directive('anolMeasure', ['$templateRequest', '$compile', '$timeout', 'ControlsService', 'LayersService', 'MapService', 'MeasureService',
        function($templateRequest, $compile, $timeout, ControlsService, LayersService, MapService, MeasureService) {
            // create a sphere whose radius is equal to the semi-major axis of the WGS84 ellipsoid
            // var wgs84Sphere = new ol.Sphere(6378137);
            var measureStyle = MeasureService.measureStyle;


            var calculateCoordinate = function(geometry) {
                return geometry.getCoordinates();
            };

            var calculateLength = MeasureService.calculateLength;
            var calculateArea = MeasureService.calculateArea;

            var formatCoordinateResult = function(geometry, projection, geodesic, labelSegments) {
                var coord = transform(geometry.getCoordinates(),
                    projection.getCode(),
                    'EPSG:4326');
                var output = '';
                output += coord[0] + ' lat | ';
                output += coord[1] + ' lon';
                return output;
            };

            var formatLineResult = MeasureService.formatLineResult;
            var formatAreaResult = MeasureService.formatAreaResult;

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

            var createModifyInteraction = function(measureSource, measureType, measureOverlay, measureResultCallback, projection, geodesic, labelSegments) {
                var modify = new Modify({
                    features: measureSource.getFeaturesCollection(),
                    condition: function(e) {
                        if (e.pointerEvent.buttons === 1) {
                            return true;
                        }  else {
                            return false;
                        }
                    }
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

                    measureOverlay.getElement().innerHTML = resultFormatter(geometry, projection, geodesic, labelSegments);
                    measureOverlay.setPosition(geometry.getLastCoordinate());
                });
                return modify;
            };

            var createDrawInteraction = function(measureSource, measureType, measureOverlay, measureResultCallback, projection, geodesic, labelSegments) {
                var draw = new Draw({
                    type: 'Point',
                    condition: function(e) {
                        if (e.pointerEvent.buttons === 1) {
                            return true;
                        }  else {
                            return false;
                        }
                    },
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

                        measureOverlay.getElement().innerHTML = resultFormatter(newGeometry, projection, geodesic, labelSegments);
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
                    geodesic: '=',
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
                    labelSegments: '=',
                    title: '@'
                },
                template: function() {
                    return require('./templates/measure.html');
                },
                link: {
                    pre: function(scope, element) {
                        scope.tooltipPlacement = angular.isDefined(scope.tooltipPlacement) ?
                        scope.tooltipPlacement : 'right';
                        scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                            scope.tooltipDelay : 500;
                        scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                            scope.tooltipEnable : !hasTouch;
                        scope.geodesic = scope.geodesic === true || scope.geodesic === 'true';
                        scope.labelSegments = angular.isDefined(scope.labelSegments) ?
                            scope.labelSegments : false;

                        // create layer to draw in
                        scope.measureSource = new VectorSource({
                            useSpatialIndex: false
                        });
                        var _measureLayer = new VectorLayer({
                            source: scope.measureSource,
                            style: scope.style || function(feature) {
                                return measureStyle(feature, scope.labelSegments)
                            },
                            zIndex: 2000
                        });

                        var layerOptions = {
                            title: scope.measureType + 'MeasureLayer',
                            name: scope.measureType + 'MeasureLayer',
                            displayInLayerswitcher: false,
                            olLayer: _measureLayer
                        };

                        scope.map = MapService.getMap();
                        scope.measureOverlay = MeasureService.createMeasureOverlay();

                        scope.draw = createDrawInteraction(scope.measureSource,
                            scope.measureType,
                            scope.measureOverlay,
                            scope.measureResultCallback,
                            scope.map.getView().getProjection(),
                            scope.geodesic,
                            scope.labelSegments
                        );

                        scope.modify = createModifyInteraction(scope.measureSource,
                            scope.measureType,
                            scope.measureOverlay,
                            scope.measureResultCallback,
                            scope.map.getView().getProjection(),
                            scope.geodesic,
                            scope.labelSegments
                        );

                        scope.deactivate = function() {
                            scope.map.removeInteraction(scope.draw);
                            scope.map.removeInteraction(scope.modify);
                            scope.measureSource.clear();
                            scope.map.removeOverlay(scope.measureOverlay);
                            scope.measureOverlay.getElement().innerHTML = '';
                            if(angular.isFunction(scope.deactivatedCallback)) {
                                scope.deactivatedCallback();
                            }
                        };

                        scope.activate = function() {
                            scope.map.addInteraction(scope.draw);
                            scope.map.addInteraction(scope.modify);
                            scope.map.addOverlay(scope.measureOverlay);
                            if(angular.isFunction(scope.activatedCallback)) {
                                scope.activatedCallback();
                            }
                        };
                        LayersService.addSystemLayer(new anol.layer.Layer(layerOptions), 0);
                    },
                    post: function(scope, AnolMapController) {
                        var control;

                        if(AnolMapController === null || scope.addToMap === false || scope.addToMap === 'false') {
                            control = new anol.control.Control({
                                exclusive: true,
                                keepMenuOpen: true,
                                olControl: null
                            });
                        } else {
                            element.addClass('ol-control');
                            element.addClass('anol-measure-' + scope.measureType);
                            control = new anol.control.Control({
                                element: element,
                                keepMenuOpen: true,
                                exclusive: true
                            });
                        }
                        control.onDeactivate(function() {
                            scope.deactivate();
                        });

                        control.onActivate(function() {
                            scope.activate();
                        });

                        scope.isActive = function() {
                            if (control.active) {
                                return true;
                            }
                            return false;
                        };

                        scope.toggle = function() {
                            if(control.active) {
                                control.deactivate();
                            } else {
                                control.activate();
                            }
                        };
                        ControlsService.addControl(control);

                    }

                }
            };
        }]);
