import './module.js';
import { transform } from 'ol/proj';
import { unByKey } from 'ol/Observable.js';
import WKT from 'ol/format/WKT.js';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import Select from 'ol/interaction/Select';

angular.module('anol.geocoder')
/**
 * @ngdoc directive
 * @name anol.geocoder.directive:anolGeocoderSearchbox
 *
 * @restrict A
 * @required $timeout
 * @requires anol.map.MapService
 * @requires anol.map.ControlsService
 *
 * @param {string} anolGeocoderSearchbox Name of geocoder to use. Must be an available anol.geocoder
 * @param {string} zoomLevel Level to show result in
 * @param {object} geocoderOptions Options for selected geocoder
 * @param {string} proxyUrl Proxy to use
 * @param {number} highlight Time result marker is visible. Use 0 for invinitiv visibility (removeable by click)
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Search for a location string on given geocoder, display and select results
 */

    .directive('anolGeocoderSearchbox', ['$templateRequest', '$compile', '$timeout', '$location', '$translate', 'MapService', 'ControlsService', 'InteractionsService', 'LayersService', 'GeocoderService', 'UrlMarkersService',
        function($templateRequest, $compile, $timeout, $location, $translate, MapService, ControlsService, InteractionsService, LayersService, GeocoderService, UrlMarkersService) {
            return {
                restrict: 'A',
                require: '?^anolMap',
                transclude: true,
                scope: {
                    graphicFileUrl: '@',
                    searchDropdown: '=',
                    toUrlMarker: '=?',
                },
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/searchbox.html');
                },
                link: function(scope, element, attrs, AnolMapController) {
                    if (attrs.templateUrl && attrs.templateUrl !== '') {
                        $templateRequest(attrs.templateUrl).then(function(html){
                            var template = angular.element(html);
                            element.append(template);
                            $compile(template)(scope);
                        });
                    }
                    scope.geocoders = GeocoderService.getConfigs();

                    if (scope.geocoders.length === 1) {
                        scope.searchDropdown = false;
                    }
                    scope.activeGeocoder = undefined;
                    angular.forEach(scope.geocoders, function(geocoder) {
                        if (geocoder.selected) {
                            scope.activeGeocoder = geocoder;
                        }
                    });

                    if (angular.isUndefined(scope.activeGeocoder)) {
                        scope.activeGeocoder = scope.geocoders[0]
                    }

                    var removeMarkerInteraction;
                    var translations = $translate([
                        'anol.geocoder.PLACEHOLDER',
                    ]).then(function(translations) {
                        scope.placeholderBase = translations['anol.geocoder.PLACEHOLDER'];
                        scope.geocoder = setAnolGeocoder(scope.activeGeocoder);
                        scope.markerLayer = createMarkerLayer(scope.activeGeocoder);
                    });

                    scope.searchResults = [];
                    scope.noResults = false;
                    scope.searchInProgress = false;
                    scope.showResultList = false;
                    scope.isScrolling = false;
                    scope.showGeocoderList = false;
                    scope.urlMarkerAdded = false;
                    scope.byResultList = false;
                    scope.map = MapService.getMap();
                      
                    var changeCursorCondition = function(pixel) {
                        return MapService.getMap().hasFeatureAtPixel(pixel, function(layer) {
                            return scope.markerLayer === layer.get('anolLayer');
                        });
                    };

                    var addUrlMarker = function(coordinate, projectionCode, label) {
                        if(scope.toUrlMarker !== true) {
                            return;
                        }
                        removeUrlMarker();
                        var position = transform(
                            coordinate,
                            projectionCode,
                            'EPSG:4326'
                        );
                        var urlParams = $location.search();

                        var urlMarkers = [];

                        if(angular.isDefined(urlParams.marker)) {
                            if(angular.isArray(urlParams.marker)) {
                                urlMarkers = urlParams.marker;
                            } else {
                                urlMarkers.push(urlParams.marker);
                            }
                        }

                        var urlMarker = {
                            'color': scope.urlMarkerColor || 'aa0000',
                            'coord':  position.join(','),
                            'srs': '4326',
                            'label': label
                        };
                        if(scope.urlMarkerWithLabel === 'true') {
                            urlMarker.label = label;
                        }
                        // var urlMarkerParams = [];
                        // angular.forEach(urlMarker, function(v, k) {
                        //   urlMarkerParams.push(k + UrlMarkersService.keyValueDelimiter + v);
                        // });
                        // var urlMarkerString = urlMarkerParams.join(UrlMarkersService.propertiesDelimiter);
                        // urlMarkers.push(urlMarkerString);
                        // $location.search('marker', urlMarkers);
                        // scope.urlMarkerAdded = true;
                    };

                    var removeUrlMarker = function() {
                        if(scope.toUrlMarker !== true) {
                            return;
                        }
                        if(!scope.urlMarkerAdded) {
                            return;
                        }
                        var urlParams = $location.search();
                        var urlMarkers = urlParams.marker;
                        if(urlMarkers.length > 0) {
                            urlMarkers.pop();
                        }
                        $location.search('marker', urlMarkers);
                        scope.urlMarkerAdded = false;
                    };

                    var addSearchResult = function(feature) {
                        var markerSource = scope.markerLayer.olLayer.getSource();
                        markerSource.addFeature(feature);

                        if(scope.highlight > 0) {
                            $timeout(function() {
                                markerSource.clear();
                            }, scope.highlight);
                        } else {
                            removeMarkerInteraction = new Select({
                                layers: [scope.markerLayer.olLayer]
                            });
                            removeMarkerInteraction.on('select', function(evt) {
                                if(evt.selected.length > 0) {
                                    removeMarkerInteraction.getFeatures().clear();
                                    markerSource.clear();
                                    InteractionsService.removeInteraction(removeMarkerInteraction);
                                    MapService.removeCursorPointerCondition(changeCursorCondition);
                                    removeMarkerInteraction = undefined;
                                    removeUrlMarker();
                                }
                            });
                            InteractionsService.addInteraction(removeMarkerInteraction);
                            MapService.addCursorPointerCondition(changeCursorCondition);
                        }
                    };

                    var addMarker = function(position) {
                        var markerFeature = new Feature({
                            geometry: new Point(position)
                        });
                        var markerSource = scope.markerLayer.olLayer.getSource();
                        markerSource.addFeature(markerFeature);
                        if(scope.highlight > 0) {
                            $timeout(function() {
                                markerSource.clear();
                            }, scope.highlight);
                        } else {
                            removeMarkerInteraction = new Select({
                                layers: [scope.markerLayer.olLayer]
                            });
                            removeMarkerInteraction.on('select', function(evt) {
                                if(evt.selected.length > 0) {
                                    removeMarkerInteraction.getFeatures().clear();
                                    markerSource.clear();
                                    InteractionsService.removeInteraction(removeMarkerInteraction);
                                    MapService.removeCursorPointerCondition(changeCursorCondition);
                                    removeMarkerInteraction = undefined;
                                    removeUrlMarker();
                                }
                            });
                            InteractionsService.addInteraction(removeMarkerInteraction);
                            MapService.addCursorPointerCondition(changeCursorCondition);
                        }
                    };

                    function createMarkerStyle(activeGeocoder) {
                        var markerStyle = {}; 
                        if (angular.isDefined(activeGeocoder.resultMarker)) {
                            markerStyle = {
                              'externalGraphic': scope.graphicFileUrl + activeGeocoder.resultMarker.graphicFile,
                              'graphicWidth': activeGeocoder.resultMarker.graphicWidth,
                              'graphicHeight': activeGeocoder.resultMarker.graphicHeight,
                              'graphicYAnchor': activeGeocoder.resultMarker.graphicYAnchor,
                              'graphicScale': activeGeocoder.resultMarker.graphicScale,
                              'strokeColor': activeGeocoder.resultMarker.strokeColor,
                              'strokeWidth': activeGeocoder.resultMarker.strokeWidth,
                              'strokeOpacity': activeGeocoder.resultMarker.strokeOpacity,
                              'fillOpacity': activeGeocoder.resultMarker.fillOpacity,
                              'fillColor': activeGeocoder.resultMarker.fillColor,
                            }
                        }   
                        return markerStyle;                         
                    }

                    function createMarkerLayer(activeGeocoder) {
                        var markerStyle = createMarkerStyle(activeGeocoder)
                        var markerLayer = new anol.layer.Feature({
                            name: 'geocoderLayer',
                            displayInLayerswitcher: false,
                            style: markerStyle
                        });
                        var markerOlLayerOptions = markerLayer.olLayerOptions;
                        markerOlLayerOptions.source = new markerLayer.OL_SOURCE_CLASS(markerLayer.olSourceOptions);
                        markerLayer.setOlLayer(new markerLayer.OL_LAYER_CLASS(markerOlLayerOptions));
                        LayersService.addSystemLayer(markerLayer); 
                        return markerLayer;                     
                    }

                    function setAnolGeocoder(activeGeocoder) {
                        var geocoderOptions = angular.copy(activeGeocoder.geocoderOptions);

                        if(angular.isDefined(activeGeocoder.proxyUrl)) {
                            if(activeGeocoder.proxyUrl[activeGeocoder.proxyUrl.length - 1] !== '/') {
                                activeGeocoder.proxyUrl += '/';
                            }
                            geocoderOptions.url = scope.proxyUrl + geocoderOptions.url;
                        }

                        scope.highlight = angular.isDefined(activeGeocoder.highlight) ? parseInt(activeGeocoder.highlight) : false;
                        var anolGeocoder = new anol.geocoder[activeGeocoder.geocoder](geocoderOptions);
                        
                        scope.highlight = activeGeocoder.resultMarkerVisible;
                        scope.zoomLevel = activeGeocoder.zoom;
                        scope.urlMarkerColor = activeGeocoder.urlMarkerColor;
                        scope.placeholder = scope.placeholderBase + ' ' + activeGeocoder.title;

                        return anolGeocoder;
                    };
                    
                    scope.$watchCollection('geocoders', function(newValue, oldValue) {
                        var found = false;
                        var baseGeocoders = [];
                        var layerGeocoders = [];

                        angular.forEach(newValue, function(geocoder) {
                            if (geocoder.name === scope.activeGeocoder.name) {
                                found = true;
                            };
                            if (geocoder.type === 'base') {
                                baseGeocoders.push(geocoder);
                            } 
                            if (geocoder.type == 'layer') {
                                layerGeocoders.push(geocoder)
                            }
                        })

                        if (!found) {
                            angular.forEach(scope.geocoders, function(geocoder) {
                                if (geocoder.selected) {
                                    scope.activateGeocoder(geocoder)
                                }
                            });
                        };
                        
                        scope.baseGeocoders = baseGeocoders;
                        scope.layerGeocoders = layerGeocoders;
                    })

                    scope.$watch('searchString', function(value) {
                        if (scope.byResultList) return;

                        if (angular.isUndefined(value)) {
                            return;
                        }
                        if (scope.activeGeocoder.autoSearchChars) {
                            if (value.length >= scope.activeGeocoder.autoSearchChars) {
                                scope.noResults = false;
                                scope.startSearch();
                            } else {
                                scope.noResults = false;
                                scope.searchResults = [];
                                scope.showResultList = false;
                                scope.isScrolling = false;                                
                                scope.searchInProgress = false;
                            }
                        }
                    });

                    scope.searchButton = function() {
                        if (scope.activeGeocoder.autoSearchChars) {
                            var found = false;
                            angular.forEach(scope.searchResults, function(result) {
                                if (result.sml === 1) {
                                    scope.showResult(result, true)
                                    found = true;
                                }
                            })
                            scope.showResultList = true;
                            if (found) {
                                return;
                            }
                        }
                        scope.startSearch();
                    }

                    scope.startSearch = function(showResultDirect) {
                        scope.searchResults = [];
                        scope.noResults = false;
                        scope.markerLayer.clear();
                        removeUrlMarker();
                        element.find('.anol-searchbox').removeClass('open');
                        if (angular.isUndefined(scope.searchString) || scope.searchString.length < scope.activeGeocoder.autoSearchChars) {
                            return;
                        }
                        scope.searchInProgress = true;
                        scope.geocoder.request(scope.searchString)
                            .then(function(results) {
                                scope.searchInProgress = false;
                                if(results.length === 0) {
                                    scope.noResults = true;
                                } else {
                                    scope.searchResults = results;
                                    scope.showResultList = true;
                                    element.find('.anol-searchbox').addClass('open');
                                }

                                if (angular.isDefined(showResultDirect) && showResultDirect === true) {
                                    angular.forEach(results, function(result) {
                                        if (result.sml === 1) {
                                            scope.showResult(result, true)
                                        }
                                    });
                                }
                                scope.handleHideElement = scope.map.on(
                                    'singleclick', scope.hideElement, this);
                                scope.$digest();
                            });
                    };

                    scope.toggleGeoCoderList = function() {
                        scope.showGeocoderList = false;
                    }

                    scope.activateGeocoder = function(geocoder) {
                        scope.activeGeocoder = geocoder;
                        scope.geocoder = setAnolGeocoder(scope.activeGeocoder);
                        scope.showGeocoderList = false;
                        scope.searchResults = [];
                        scope.showResultList = false;
                        scope.isScrolling = false;                                
                        scope.searchInProgress = false;
                        scope.searchString = undefined;

                        // update style and clear source
                        var markerStyle = createMarkerStyle(scope.activeGeocoder);
                        var markerSource = scope.markerLayer.olLayer.getSource();
                        markerSource.clear();
                        scope.markerLayer.style = markerStyle;
                        scope.markerLayer.setStyle();
                    }

                    scope.hideElement = function() {
                        element.find('.anol-searchbox').removeClass('open');
                        unByKey(scope.handleHideElement);
                    }
                    scope.hideGeocoderList = function() {
                        $scope.showGeocoderList = false;
                    }

                    scope.handleInputKeypress = function(event) {
                        event.stopPropagation();
                        if((event.key === 'ArrowDown' || event.keyCode === 40) && scope.searchResults.length > 0) {
                            event.preventDefault();
                            element.find('.dropdown-menu li a:first').focus();
                        }
                        if(event.key === 'Enter' || event.keyCode === 13) {
                            event.preventDefault();
                            scope.startSearch(true);
                        }
                        return false;
                    };
                    scope.handleInputFocus = function(event) {
                        if (scope.searchResults.length > 0) {
                            scope.showResultList = true;
                        }
                        scope.showGeocoderList = false;
                    };
                    scope.handleInputBlur = function(event) {
                        scope.showResultList = false;
                    };
                    scope.handleResultListMousedown = function(event) {
                        scope.isScrolling = true;
                    };
                    scope.handleResultListMouseup = function(event) {
                        scope.isScrolling = false;
                    };

                    scope.handleResultElementKeypress = function(event) {
                        event.stopPropagation();
                        var targetParent = angular.element(event.currentTarget).parent();
                        if(event.key === 'ArrowDown' || event.keyCode === 40) {
                            event.preventDefault();
                            targetParent.next().find('a').focus();
                        }
                        if(event.key === 'ArrowUp' || event.keyCode === 38) {
                            event.preventDefault();
                            var target = targetParent.prev().find('a');
                            if(target.length === 0) {
                                element.find('.form-control').focus();
                            } else {
                                target.focus();
                            }
                        }
                        return false;
                    };

                    scope.handleResultElementMouseover = function(event) {
                        scope.isScrolling = false;
                        angular.element(event.currentTarget).focus();
                    };

                    scope.handleResultElementFocus = function(event) {
                        scope.showResultList = true;
                    };

                    scope.handleResultElementBlur = function(event) {
                        if(scope.isScrolling) {
                            angular.element(event.currentTarget).focus();
                        } else {
                            scope.showResultList = false;
                        }
                    };

                    scope.showResult = function(result, withResultList) {
                        scope.byResultList = true;
                        var view = MapService.getMap().getView();

                        var format = new WKT();
                        var feature = format.readFeature(result.wkt, {
                            dataProjection: result.projectionCode,
                            featureProjection: view.getProjection().getCode()
                        });
                        addSearchResult(feature);
                        view.fit(
                            scope.markerLayer.olLayer.getSource().getExtent(), 
                            {
                                duration: 1000
                            }
                        );                        
                        
                        addUrlMarker(
                            feature.getGeometry().getFirstCoordinate(),
                            result.projectionCode,
                            result.displayText
                        );

                        if (angular.isUndefined(withResultList) || withResultList == false) {
                            scope.searchResults = [];
                            element.find('.anol-searchbox').removeClass('open');
                            unByKey(scope.handleHideElement);
                            scope.searchString = result.displayText;
                            $timeout(function() {
                                scope.byResultList = false;
                            });
                          }
                    };

                    if(angular.isObject(AnolMapController)) {
                        ControlsService.addControl(new anol.control.Control({
                            element: element
                        }));
                    }
                }
            };
        }]);