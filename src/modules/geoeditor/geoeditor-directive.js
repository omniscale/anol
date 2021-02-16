import './module.js';
import { TOUCH as hasTouch } from 'ol/has';
import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import Snap from 'ol/interaction/Snap';
import {never as neverCondition, singleClick} from 'ol/events/condition';

angular.module('anol.geoeditor')
/**
 * @ngdoc directive
 * @name anol.geoeditor.anolGeoeditor
 *
 * @requires $compile
 * @requires $rootScope
 * @requires $translate
 * @requires anol.map.MapService
 * @requires anol.map.ControlsSerivce
 * @requires anol.map.GeoeditorService
 *
 * @param {boolean} continueDrawing Don't deactivate drawing after feature is added
 * @param {function} postDrawAction Action to call after feature is drawn. Draw control will be deactivated when postDrawAction defined.
 * @param {boolean} freeDrawing Deactivate snapped drawing
 * @param {string} pointTooltipPlacement Position of point tooltip
 * @param {string} lineTooltipPlacement Position of line tooltip
 * @param {string} polygonTooltipPlacement Position of polygon tooltip
 * @param {number} tooltipDelay Time in milisecounds to wait before display tooltip
 * @param {boolean} tooltipEnable Enable tooltips. Default true for non-touch screens, default false for touchscreens
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Provides controls to draw points, lines and polygons, modify and remove them
 */
    .directive('anolGeoeditor', ['$templateRequest', '$compile', '$rootScope', '$translate', '$timeout', 'ControlsService', 'MapService', 'GeoeditorService',
        function($templateRequest, $compile, $rootScope, $translate, $timeout, ControlsService, MapService, GeoeditorService) {
            return {
                restrict: 'A',
                require: '?^anolMap',
                scope: {
                    continueDrawing: '@',
                    postDrawAction: '&',
                    freeDrawing: '@',
                    tooltipDelay: '@',
                    tooltipEnable: '@',
                    pointTooltipPlacement: '@',
                    lineTooltipPlacement: '@',
                    polygonTooltipPlacement: '@'
                },
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/geoeditor.html');
                },
                link: function(scope, element, attrs, AnolMapController) {
                    if (attrs.templateUrl && attrs.templateUrl !== '') {
                        $templateRequest(attrs.templateUrl).then(function(html){
                            var template = angular.element(html);
                            element.html(template);
                            $compile(template)(scope);
                        });
                    } 
                    // attribute defaults
                    scope.continueDrawing = angular.isDefined(scope.continueDrawing) ?
                        scope.continueDrawing : false;
                    scope.freeDrawing = angular.isDefined(scope.freeDrawing) ?
                        scope.freeDrawing : false;
                    scope.tooltipEnable = angular.isDefined(scope.tooltipEnable) ?
                        scope.tooltipEnable : !hasTouch;
                    scope.tooltipDelay = angular.isDefined(scope.tooltipDelay) ?
                        scope.tooltipDelay : 500;
                    scope.pointTooltipPlacement = angular.isDefined(scope.pointTooltipPlacement) ?
                        scope.pointTooltipPlacement : 'right';
                    scope.lineTooltipPlacement = angular.isDefined(scope.lineTooltipPlacement) ?
                        scope.lineTooltipPlacement : 'right';
                    scope.polygonTooltipPlacement = angular.isDefined(scope.polygonTooltipPlacement) ?
                        scope.polygonTooltipPlacement : 'right';

                    scope.activeLayer = undefined;
                    scope.modifyActive = false;
                    var selectedFeature;
                    var controls = [];
                    var drawPointControl, drawLineControl, drawPolygonControl, modifyControl;

                    // disabled by default. Will be enabled, when feature selected
                    var removeButtonElement = element.find('.draw-remove');
                    removeButtonElement.addClass('disabled');

                    var executePostDrawCallback = function(evt) {
                        scope.postDrawAction()(scope.activeLayer, evt.feature);
                    };

                    var createDrawInteractions = function(drawType, source, control, layer, postDrawActions) {
                        postDrawActions = postDrawActions || [];
                        // create draw interaction
                        var draw = new Draw({
                            source: source,
                            type: drawType,
                            stopClick: true
                        });

                        if(angular.isFunction(scope.postDrawAction) && angular.isFunction(scope.postDrawAction())) {
                            postDrawActions.push(executePostDrawCallback);
                        }

                        if(scope.continueDrawing === false && angular.isDefined(control)) {
                            postDrawActions.push(function() {
                                control.deactivate();
                            });
                        }

                        // bind post draw actions
                        angular.forEach(postDrawActions, function(postDrawAction) {
                            draw.on('drawend', postDrawAction);
                        });

                        var interactions = [draw];
                        if(scope.freeDrawing !== false) {
                            var snapInteraction = new Snap({
                                source: layer.getSource()
                            });
                            interactions.push(snapInteraction);
                        }
                        return interactions;
                    };

                    var createModifyInteractions = function(layer) {
                        var selectInteraction = new Select({
                            toggleCondition: neverCondition,
                            layers: [layer]
                        });
                        selectInteraction.on('select', function(evt) {
                            if(evt.selected.length === 0) {
                                selectedFeature = undefined;
                                removeButtonElement.addClass('disabled');
                            } else {
                                selectedFeature = evt.selected[0];
                                removeButtonElement.removeClass('disabled');
                            }
                        });
                        var modifyInteraction = new Modify({
                            features: selectInteraction.getFeatures(),
                            deleteCondition: mapBrowserEvent => {
                                return singleClick(mapBrowserEvent);
                            }
                        });
                        var snapInteraction = new Snap({
                            source: layer.getSource()
                        });
                        return [selectInteraction, modifyInteraction, snapInteraction];
                    };

                    var createDrawControl = function(controlElement, controlTarget) {
                        var controlOptions = {
                            element: controlElement,
                            target: controlTarget,
                            exclusive: true,
                            disabled: true
                        };
                        if(AnolMapController === null) {
                            controlOptions.olControl = null;
                        }
                        var drawControl = new anol.control.Control(controlOptions);
                        drawControl.onDeactivate(deactivate, scope);
                        drawControl.onActivate(activate, scope);
                        return drawControl;
                    };

                    var createModifyControl = function(controlElement, controlTarget) {
                        var controlOptions = {
                            element: controlElement,
                            target: controlTarget,
                            exclusive: true,
                            disabled: true
                        };
                        if(AnolMapController === null) {
                            controlOptions.olControl = null;
                        }
                        var _modifyControl = new anol.control.Control(controlOptions);

                        // modifyControl adds all interactions needed at activate time
                        // otherwise, a feature added programmaticaly is not selectable
                        // until modify control is enabled twice by user
                        // reproducable with featureexchange module when uploading a geojson
                        // and try to select uploaded feature for modify
                        _modifyControl.onDeactivate(function(targetControl) {
                            angular.forEach(targetControl.interactions, function(interaction) {
                                interaction.setActive(false);
                                MapService.getMap().removeInteraction(interaction);
                            });
                        });
                        _modifyControl.onActivate(function(targetControl) {
                            targetControl.interactions = createModifyInteractions(scope.activeLayer.olLayer);
                            angular.forEach(targetControl.interactions, function(interaction) {
                                interaction.setActive(true);
                                scope.map.addInteraction(interaction);
                            });
                        });
                        _modifyControl.onDeactivate(function() {
                            selectedFeature = undefined;
                        });
                        return _modifyControl;
                    };

                    var deactivate = function(targetControl) {
                        angular.forEach(targetControl.interactions, function(interaction) {
                            interaction.setActive(false);
                        });
                    };

                    var activate = function(targetControl) {
                        angular.forEach(targetControl.interactions, function(interaction) {
                            interaction.setActive(true);
                        });
                    };

                    var changeCursorCondition = function(pixel) {
                        return scope.map.hasFeatureAtPixel(pixel, function(layer) {
                            return layer === scope.activeLayer.olLayer;
                        });
                    };

                    // Button binds
                    scope.drawPoint = function() {
                        if(drawPointControl.disabled === true) {
                            return;
                        }
                        if(drawPointControl.active) {
                            drawPointControl.deactivate();
                        } else {
                            drawPointControl.activate();
                        }
                    };

                    scope.drawLine = function() {
                        if(drawLineControl.disabled === true) {
                            return;
                        }
                        if(drawLineControl.active) {
                            drawLineControl.deactivate();
                        } else {
                            drawLineControl.activate();
                        }
                    };

                    scope.drawPolygon = function() {
                        if(drawPolygonControl.disabled === true) {
                            return;
                        }
                        if(drawPolygonControl.active) {
                            drawPolygonControl.deactivate();
                        } else {
                            drawPolygonControl.activate();
                        }
                    };

                    scope.modify = function() {
                        if(modifyControl.disabled === true) {
                            return;
                        }
                        if(modifyControl.active) {
                            modifyControl.deactivate();
                        } else {
                            modifyControl.activate();
                        }
                    };

                    scope.remove = function() {
                        if(angular.isDefined(selectedFeature)) {
                            scope.activeLayer.olLayer.getSource().removeFeature(selectedFeature);
                            modifyControl.interactions[0].getFeatures().clear();
                            selectedFeature = undefined;
                        }
                    };

                    // extra action for a really customised draw experience
                    scope.drawCustom = function(drawType, postDrawCallback) {
                        // skip when no active layer present
                        if(angular.isUndefined(scope.activeLayer)) {
                            return;
                        }
                        // deactivate other controls
                        angular.forEach(controls, function(control) {
                            control.deactivate();
                        });

                        var olLayer = scope.activeLayer.olLayer;
                        var source = olLayer.getSource();
                        var customDrawControl = new anol.control.Control({
                            exclusive: true,
                            olControl: null
                        });
                        // stores control activate event handler unregistering informations
                        var unregisters = [];
                        var deregisterActiveLayerChange;
                        var customInteractions;
                        var removeCustomDraw = function() {
                            angular.forEach(customInteractions, function(interaction) {
                                interaction.setActive(false);
                                scope.map.removeInteraction(interaction);
                            });
                            deregisterActiveLayerChange();
                            angular.forEach(unregisters, function(unregister) {
                                unregister[0].unActivate(unregister[1]);
                            });

                            customDrawControl.deactivate();
                            ControlsService.removeControl(customDrawControl);
                        };

                        // call the callback function
                        var postDrawAction = function(evt) {
                            postDrawCallback(scope.activeLayer, evt.feature);
                        };
                        // remove custom draw after draw finish
                        var postDrawRemoveCustomDraw = function() {
                            // TODO remove when https://github.com/openlayers/ol3/issues/3610/ resolved
                            $timeout(function() {
                                removeCustomDraw();
                            }, 275);
                        };

                        // third param is control we don't need for this action
                        customInteractions = createDrawInteractions(drawType, source, undefined, olLayer, [postDrawAction, postDrawRemoveCustomDraw]);

                        // remove custom draw when active layer changes
                        deregisterActiveLayerChange = scope.$watch(function() {
                            return GeoeditorService.activeLayer;
                        }, function(newActiveLayer) {
                            if(newActiveLayer === scope.activeLayer && newActiveLayer !== undefined) {
                                return;
                            }
                            removeCustomDraw();
                        });

                        // remove custom draw when one of the other controls get active
                        angular.forEach(controls, function(control) {
                            unregisters.push([control, control.oneActivate(function() {
                                removeCustomDraw();
                            })]);
                        });

                        // activate and add customInteractions
                        angular.forEach(customInteractions, function(interaction) {
                            interaction.setActive(true);
                            scope.map.addInteraction(interaction);
                        });
                        ControlsService.addControl(customDrawControl);
                        customDrawControl.activate();
                        return removeCustomDraw;
                    };

                    scope.map = MapService.getMap();

                    element.addClass('anol-geoeditor');

                    if(AnolMapController !== null) {
                        element.addClass('ol-control');
                        var drawControl = new anol.control.Control({
                            element: element
                        });
                        controls.push(drawControl);
                    }

                    drawPointControl = createDrawControl(
                        element.find('.draw-point'),
                        element
                    );
                    controls.push(drawPointControl);

                    drawLineControl = createDrawControl(
                        element.find('.draw-line'),
                        element
                    );
                    controls.push(drawLineControl);

                    drawPolygonControl = createDrawControl(
                        element.find('.draw-polygon'),
                        element
                    );
                    controls.push(drawPolygonControl);

                    modifyControl = createModifyControl(
                        element.find('.draw-modify'),
                        element
                    );
                    modifyControl.onActivate(function() {
                        MapService.addCursorPointerCondition(changeCursorCondition);
                    });
                    modifyControl.onDeactivate(function(control) {
                        control.interactions[0].getFeatures().clear();
                        removeButtonElement.addClass('disabled');
                        MapService.removeCursorPointerCondition(changeCursorCondition);
                    });
                    controls.push(modifyControl);

                    ControlsService.addControls(controls);

                    var allInteractions = function() {
                        return drawPointControl.interactions
                            .concat(drawLineControl.interactions)
                            .concat(drawPolygonControl.interactions)
                            .concat(modifyControl.interactions);
                    };

                    var visibleDewatcher;

                    var bindActiveLayer = function(layer) {
                        drawPointControl.interactions = createDrawInteractions(
                            'Point', layer.olLayer.getSource(), drawPointControl, layer.olLayer);
                        drawPointControl.enable();
                        drawLineControl.interactions = createDrawInteractions(
                            'LineString', layer.olLayer.getSource(), drawLineControl, layer.olLayer);
                        drawLineControl.enable();
                        drawPolygonControl.interactions = createDrawInteractions(
                            'Polygon', layer.olLayer.getSource(), drawPolygonControl, layer.olLayer);
                        drawPolygonControl.enable();
                        modifyControl.enable();

                        angular.forEach(allInteractions(), function(interaction) {
                            interaction.setActive(false);
                            scope.map.addInteraction(interaction);
                        });

                        scope.activeLayer = layer;

                        visibleDewatcher = scope.$watch(function() {
                            return scope.activeLayer.getVisible();
                        }, function(n) {
                            if(n === false) {
                                GeoeditorService.changeLayer(undefined);
                            }
                        });
                    };

                    var unbindActiveLayer = function() {
                        angular.forEach(allInteractions(), function(interaction) {
                            interaction.setActive(false);
                            scope.map.removeInteraction(interaction);
                        });

                        drawPointControl.disable();
                        drawPointControl.interactions = [];
                        drawLineControl.disable();
                        drawLineControl.interactions = [];
                        drawPolygonControl.disable();
                        drawPolygonControl.interactions = [];
                        modifyControl.disable();
                        modifyControl.interactions = [];

                        if(angular.isDefined(visibleDewatcher)) {
                            visibleDewatcher();
                        }

                        scope.activeLayer = undefined;
                    };

                    scope.$watch(function() {
                        return GeoeditorService.activeLayer;
                    }, function(newActiveLayer, oldActiveLayer) {
                        if(newActiveLayer === scope.activeLayer) {
                            return;
                        }
                        if(angular.isDefined(oldActiveLayer)) {
                            unbindActiveLayer();
                        }
                        if(angular.isDefined(newActiveLayer)) {
                            bindActiveLayer(newActiveLayer);
                        }
                    });

                    scope.$watch(function() {
                        return modifyControl.active;
                    }, function() {
                        scope.modifyActive = modifyControl.active;
                    });
                }
            };
        }]);
