import { defaults } from './module.js'
import Overlay from 'ol/Overlay';
import Cluster from 'ol/source/Cluster';

// TODO rename to popup
angular.module('anol.featurepopup')
/**
 * @ngdoc directive
 * @name anol.featurepopup.directive:anolFeaturePopup
 *
 * @restrict A
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {anol.layer.Feature} layers Layers to show popup for
 * @param {number} tolerance Click tolerance in pixel
 * @param {object} openFor Accepts an object with layer and feature property. If changed, a popup is shown for given value
 * @param {string} openingDirection Direction where the popup open. Default is top. Also the values left, bottom and right are possible
 * @param {number} autoPanMargin Popup margin to map border for auto pan
 *
 * @description
 * Shows a popup for selected feature
 */
.directive('anolFeaturePopup', ['$templateRequest', '$compile','$window', '$timeout', 'MapService', 'LayersService', 'ControlsService', 'PopupsService', 
    function($templateRequest, $compile, $window, $timeout, MapService, LayersService, ControlsService, PopupsService) {
    // TODO use for all css values
    var cssToFloat = function(v) {
        return parseFloat(v.replace(/[^-\d\.]/g, ''));
    };

    return {
        restrict: 'A',
        scope: {
            'layers': '=?',
            'excludeLayers': '=?',
            'tolerance': '=?',
            'openFor': '=?',
            'openingDirection': '@',
            'onClose': '&?',
            'coordinate': '=?',
            'offset': '=?',
            'closeOnZoom': '=?',
            '_autoPanMargin': '=autoPanMargin',
            '_popupFlagSize': '=popupFlagSize',
            '_mobileFullscreen': '=mobileFullscreen',
            '_autoPanOnSizeChange': '=autoPanOnSizeChange',
            '_allowDrag': '=allowDrag'
        },
        replace: true,
        transclude: true,
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return '<div></div>';
            }
            return require('./templates/popup.html')
        },           
        link: function(scope, element, attrs) {
            if (attrs.templateUrl && attrs.templateUrl !== '') {
                $templateRequest(attrs.templateUrl).then(function(html){
                    var template = angular.element(html);
                    element.html(template);
                    $compile(template)(scope);
                });
            }             
            var self = this;
            PopupsService.register(scope);
            var multiselect = angular.isDefined(attrs.multiselect);
            var clickPointSelect = angular.isDefined(attrs.clickPointSelect);
            scope.sticky = angular.isDefined(attrs.sticky);
            scope.openingDirection = scope.openingDirection || 'top';
            scope.map = MapService.getMap();

            scope.feature = undefined;
            scope.layer = undefined;
            scope.selects = {};

            scope.autoPanMargin = angular.isDefined(scope._autoPanMargin) ? scope._autoPanMargin : 20;
            scope.popupFlagSize = angular.isDefined(scope._popupFlagSize) ? scope._popupFlagSize : 15;
            scope.mobileFullscreen = angular.isDefined(scope._mobileFullscreen) ? scope._mobileFullscreen : false;
            scope.autoPanOnSizeChange = angular.isDefined(scope._autoPanOnSizeChange) ? scope._autoPanOnSizeChange : false;
            scope.allowDrag = angular.isDefined(scope._allowDrag) ? scope._allowDrag : false;
            if(angular.isUndefined(scope.layers)) {
                scope.layers = [];
                scope.$watchCollection(function() {
                    return LayersService.flattedLayers();
                }, function(layers) {
                    scope.layers.length = 0;
                    angular.forEach(layers, function(layer) {
                        if(!(layer instanceof anol.layer.Feature)) {
                            return;
                        }
                        if(angular.isDefined(scope.excludeLayers) && scope.excludeLayers.indexOf(layer) > -1) {
                            return;
                        }
                        scope.layers.push(layer);
                    });
                });
            }
            scope.overlayOptions = {
                element: element[0],
                autoPan: true,
                autoPanAnimation: {
                    duration: 250
                },
                autoPanMargin: scope.autoPanMargin
            };

            if(scope.coordinate !== undefined) {
                scope.overlayOptions.position = scope.coordinate;
            }
            if(scope.offset !== undefined) {
                scope.overlayOptions.offset = scope.offset;
            }

            if (scope.closeOnZoom !== undefined) {
                scope.map.getView().on('change:resolution', function() {
                    scope.coordinate = undefined;
                }, this);
            }

            scope.popup = new Overlay(scope.overlayOptions);
            scope.map.addOverlay(scope.popup);
            element.parent().addClass('anol-popup-container');
            if(scope.mobileFullscreen === true) {
                element.parent().addClass('mobile-fullscreen');
            }

            if(scope.sticky) {
                return;
            }

            var updateOffset = function(featureLayerList) {
                if(scope.offset !== undefined) {
                    return;
                }
                var offset = [0, 0];
                angular.forEach(featureLayerList, function(v) {
                    var feature = v[0];
                    var layer = v[1];
                    var style = feature.getStyle();
                    if(style === null) {
                        style = layer.getStyle();
                    }
                    if(angular.isFunction(style)) {
                        style = style(feature, scope.map.getView().getResolution())[0];
                    }
                    var image = style.getImage();
                    // only ol.Style.Icons (subclass of ol.Style.Image) have getSize function
                    if(image !== null && angular.isFunction(image.getSize)) {
                        var size = image.getSize();
                        switch(scope.openingDirection) {
                            case 'top':
                                offset[1] = Math.min(offset[1], size[1] / -2);
                            break;
                            case 'bottom':
                                offset[1] = Math.min(offset[1], size[1] / 2);
                            break;
                            case 'left':
                                offset[0] = Math.min(offset[0], size[0] / -2);
                            break;
                            case 'right':
                                offset[0] = Math.min(offset[0], size[0] / 2);
                            break;
                        }

                    }
                });
                scope.popup.setOffset(offset);
            };

            var handleClick = function(evt) {
                var extent = [
                    evt.coordinate[0] - (scope.tolerance || 0),
                    evt.coordinate[1] - (scope.tolerance || 0),
                    evt.coordinate[0] + (scope.tolerance || 0),
                    evt.coordinate[1] + (scope.tolerance || 0)
                ];
                var found = false;
                var features = [];
                var singleFeature, singleLayer;

                if(clickPointSelect) {
                    var mapResolution = scope.map.getView().getResolution();
                    angular.forEach(scope.layers, function(layer) {
                        if(!layer.getVisible()) {
                            return;
                        }
                        // don't show popup if layer has min and maxresolution
                        if (layer.olLayer.getMinResolution() > mapResolution || 
                            layer.olLayer.getMaxResolution() < mapResolution) {
                            return;
                        }

                        var _features = layer.olLayer.getSource().getFeaturesInExtent(extent);

                        if(_features.length > 0) {
                            features = features.concat(_features);
                            found = true;
                            if(singleFeature === undefined) {
                                singleFeature = _features[0];
                                singleLayer = layer;
                            }
                            scope.selects[layer.name] = {
                                layer: layer,
                                features: _features
                            };
                        }
                    });
                    if(found === true) {
                        scope.coordinate = evt.coordinate;
                    } else {
                        scope.coordinate = undefined;
                    }
                } else {
                    if(multiselect === true) {
                        scope.selects = {};
                    } else {
                        scope.feature = undefined;
                        scope.layer = undefined;
                    }

                    found = false;
                    var featureLayerList = [];
                    scope.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                        if(layer === undefined || layer === null) {
                            return;
                        }

                        if(layer.getSource() instanceof Cluster) {
                            // set to original feature when clicked on clustered feature containing one feature
                            if(feature.get('features').length === 1) {
                                feature = feature.get('features')[0];
                            } else {
                                return;
                            }
                        }

                        var anolLayer = layer.get('anolLayer');

                        if(scope.layers.indexOf(anolLayer) === -1) {
                            return;
                        }

                        if(multiselect !== true) {
                            if(scope.layer === undefined && scope.feature === undefined) {
                                scope.layer = anolLayer;
                                scope.feature = feature;
                                featureLayerList.push([feature, layer]);
                                found = true;
                            }
                            return;
                        }
                        if(scope.selects[anolLayer.name] === undefined) {
                            scope.selects[anolLayer.name] = {
                                layer: anolLayer,
                                features: []
                            };
                        }
                        scope.selects[anolLayer.name].features.push(feature);
                        featureLayerList.push([feature, layer]);
                        found = true;
                    });
                    if(found) {
                        scope.coordinate = evt.coordinate;
                    } else {
                        scope.coordinate = undefined;
                    }
                    updateOffset(featureLayerList);
                }
                scope.$digest();
            };

            var changeCursorCondition = function(pixel) {
                var coordinate = scope.map.getCoordinateFromPixel(pixel);
                var hasFeatureAtPixel = false;
                angular.forEach(scope.layers, function(layer) {
                    if(!layer.getVisible()) {
                        return;
                    }
                    if (layer.olLayer.getSource() && layer.olLayer.getSource().getFeaturesAtCoordinate(coordinate).length > 0) {
                        hasFeatureAtPixel = true;;
                    };
                });
                return hasFeatureAtPixel;
            };

            var bindCursorChange = function() {
                if(scope.layers === undefined || scope.layers.length === 0) {
                    MapService.removeCursorPointerCondition(changeCursorCondition);
                } else if(scope.layers !== undefined && scope.layers.length !== 0) {
                    MapService.addCursorPointerCondition(changeCursorCondition);
                }
            };

            var control = new anol.control.Control({
                subordinate: true,
                olControl: null
            });
            control.onDeactivate(function() {
                scope.map.un('singleclick', handleClick, self);
                MapService.removeCursorPointerCondition(changeCursorCondition);
            });
            control.onActivate(function() {
                scope.map.on('singleclick', handleClick, self);
                MapService.addCursorPointerCondition(changeCursorCondition);
            });

            scope.$watch('layers', function(n, o) {
                if(angular.equals(n, o)) {
                    return;
                }
                scope.coordinate = undefined;
            });

            control.activate();

            ControlsService.addControl(control);

            scope.$watch('layers', bindCursorChange);
            scope.$watch('coordinate', function(coordinate) {
                if(coordinate === undefined) {
                    scope.selects = {};
                    scope.layer = undefined;
                    scope.feature = undefined;
                    if(angular.isFunction(scope.onClose) && angular.isFunction(scope.onClose())) {
                        scope.onClose()();
                    }
                }
                else if (scope.mobileFullscreen === true && $window.innerWidth >= 480) {
                    var xPadding = parseInt(element.css('padding-left').replace(/[^-\d\.]/g, ''));
                    xPadding += parseInt(element.css('padding-right').replace(/[^-\d\.]/g, ''));
                    var yPadding = parseInt(element.css('padding-top').replace(/[^-\d\.]/g, ''));
                    yPadding += parseInt(element.css('padding-bottom').replace(/[^-\d\.]/g, ''));
                    var mapElement = $(scope.map.getTargetElement());
                    var maxWidth = mapElement.width() - (scope.autoPanMargin * 2) - xPadding;
                    var maxHeight = mapElement.height() - (scope.autoPanMargin * 2) - yPadding;
                    if(scope.openingDirection === 'top' || scope.openingDirection === 'bottom') {
                        maxHeight -= scope.popupFlagSize;
                    } else {
                        maxWidth -= scope.popupFlagSize;
                    }
                    var content = element.find('.anol-popup-content').children();
                    if(content.length > 0) {
                        var target = content.first();
                        target.css('max-width', maxWidth + 'px');
                        target.css('max-height', maxHeight + 'px');
                    }
                }
                $timeout(function() {
                    scope.popup.setPosition(coordinate);
                });
            });
            scope.$watch('openFor', function(openFor) {
                if(angular.isDefined(openFor)) {
                    scope.layer = openFor.layer;
                    scope.feature = openFor.feature;

                    if('coordinate' in openFor) {
                        scope.coordinate = openFor.coordinate;
                    } else if(scope.feature !== undefined) {
                        scope.coordinate = scope.feature.getGeometry().getLastCoordinate();
                    }

                    if(openFor.content !== undefined) {
                        element.find('.anol-popup-content').empty().append(openFor.content);
                    }
                    scope.openFor = undefined;
                }
            });

            if(scope.autoPanOnSizeChange === true) {
                scope.$watchCollection(function() {
                    return {
                        w: element.width(),
                        h: element.height()
                    };
                }, function() {
                    scope.popup.setPosition(undefined);
                    scope.popup.setPosition(scope.coordinate);
                });
            }
            scope.makeDraggable = function(event) {
                if(scope.allowDrag === false) {
                    return;
                }
                var y = cssToFloat(element.parent().css('top')) + cssToFloat(element.css('top'));
                var x = cssToFloat(element.parent().css('left')) + cssToFloat(element.css('left'));

                PopupsService.makeDraggable(scope, [x, y], scope.feature, scope.layer, scope.selects, event);
            };
        },
        controller: function($scope, $element, $attrs) {
            this.close = function() {
                if($scope.coordinate !== undefined) {
                    $scope.coordinate = undefined;
                }
            };
            $scope.close = this.close;
        }
    };
}]);
