angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.ClusterSelectServiceProvider
 */
.provider('ClusterSelectService', [function() {

    var _clusterSelectOptions;

    this.setClusterSelectOptions = function(options) {
        _clusterSelectOptions = options;
    };

    this.$get = ['MapService', function(MapService) {

        var defaultClusterOptions = {
            selectCluster: true,
            pointRadius: 10,
            spiral: true,
            circleMaxObjects: 10,
            maxObjects: 60,
            animate: false,
            animationDuration: 500
        };

        var ClusterSelect = function(clusterSelectOptions) {
            this.clusterLayers = [];
            this.selectRevealedFeatureCallbacks = [];
            this.clusterSelectOptions = clusterSelectOptions;
            this.selectedClusterLayer = undefined;
        };

        ClusterSelect.prototype.registerSelectRevealedFeatureCallback = function(f) {
            this.selectRevealedFeatureCallbacks.push(f);
        };

        ClusterSelect.prototype.addLayer = function(layer) {
            var self = this;
            layer.olLayer.on('change:visible', function() {
                if(!layer.getVisible() && layer === self.selectedClusterLayer) {
                    self.selectClusterInteraction.clear();
                }
            });
            this.clusterLayers.push(layer);
        };

        ClusterSelect.prototype.layerByFeature = function(feature) {
            var self = this;
            var resultLayer;
            // TODO collect all anol.layer.Feature into a list
            angular.forEach(self.clusterLayers, function(layer) {
                if(angular.isDefined(resultLayer)) {
                    return;
                }
                if(layer.unclusteredSource.getFeatures().indexOf(feature) > -1) {
                    if(layer instanceof anol.layer.DynamicGeoJSON) {
                        if(feature.get('__layer__') === layer.name) {
                            resultLayer = layer;
                        }
                    } else {
                        resultLayer = layer;
                    }
                }
            });
            return resultLayer;
        };

        ClusterSelect.prototype.getControl = function(recreate) {
            var self = this;
            if(self.clusterLayers.length === 0) {
                return;
            }

            if(angular.isDefined(self.selectClusterControl) && recreate !== true) {
                return self.selectClusterControl;
            }

            var olClusterLayers = [];
            angular.forEach(self.clusterLayers, function(layer) {
                olClusterLayers.push(layer.olLayer);
            });

            var interactionOptions = $.extend({}, defaultClusterOptions, this.clusterSelectOptions, {
                layers: olClusterLayers,
                // for each revealed feature of selected cluster, this function is called
                featureStyle: function(revealedFeature, resolution) {
                    var style = new ol.style.Style();
                    // style link lines
                    if(revealedFeature.get('selectclusterlink') === true) {
                        style = new ol.style.Style({
                            stroke: new ol.style.Stroke({
                                color: '#f00',
                                width: 1
                            })
                        });
                    }
                    if(revealedFeature.get('selectclusterfeature') === true) {
                        var originalFeature = revealedFeature.get('features')[0];
                        var layer = self.layerByFeature(originalFeature);
                        var layerStyle = layer.olLayer.getStyle();

                        if(angular.isFunction(layerStyle)) {
                            layerStyle = layerStyle(originalFeature, resolution)[0];
                        }

                        style = layerStyle;
                    }

                    return [style];
                },
                style: function(clusterFeature, resolution) {
                    if(clusterFeature.get('features').length === 1) {
                        var layer = self.layerByFeature(clusterFeature.get('features')[0]);
                        var style = layer.olLayer.getStyle();
                        if(angular.isFunction(style)) {
                            style = style(clusterFeature, resolution);
                        }
                        if(angular.isArray(style)) {
                            return style;
                        }
                        return [style];
                    }
                    return [new ol.style.Style()];
                }
            });

            var selectedCluster;
            self.selectClusterInteraction = new ol.interaction.SelectCluster(interactionOptions);

            var changeCursorCondition = function(pixel) {
                return MapService.getMap().hasFeatureAtPixel(pixel, function(layer) {
                    var found = false;
                    if(self.selectClusterInteraction.overlayLayer_ === layer) {
                        MapService.getMap().forEachFeatureAtPixel(pixel, function(feature) {
                            if(found) {
                                return;
                            }
                            if(feature.get('selectclusterfeature')) {
                                found = true;
                            }
                        });
                    }
                    return found;
                });
            };

            MapService.addCursorPointerCondition(changeCursorCondition);

            self.selectClusterInteraction.on('select', function(a) {
                if(a.selected.length === 1) {
                    var revealedFeature = a.selected[0];
                    if(revealedFeature.get('features').length > interactionOptions.maxObjects) {
                        var view = MapService.getMap().getView();
                        view.setZoom(view.getZoom() + 1);
                        return;
                    }
                    if(revealedFeature.get('features').length > 1) {
                        // cluster open
                        selectedCluster = revealedFeature;
                        selectedCluster.setStyle(new ol.style.Style());
                        MapService.addCursorPointerCondition(changeCursorCondition);
                        return;
                    }
                    if(revealedFeature.get('selectclusterfeature') === true) {
                        // revealedFeature selected
                        var originalFeature = revealedFeature.get('features')[0];
                        var layer = self.layerByFeature(originalFeature);
                        angular.forEach(self.selectRevealedFeatureCallbacks, function(f) {
                            f(revealedFeature, originalFeature, layer);
                        });
                    }
                } else if(a.selected.length === 0 && angular.isDefined(selectedCluster)) {
                    // cluster closed
                    selectedCluster.setStyle(null);
                    selectedCluster = undefined;
                    MapService.removeCursorPointerCondition(changeCursorCondition);
                }
            });

            self.selectClusterInteraction.getFeatures().on('add', function(e) {
                var features = e.element.get('features');
                var layer = self.layerByFeature(features[0]);
                self.selectedClusterLayer = layer;
                if(angular.isFunction(layer.clusterOptions.onSelect)) {
                    layer.clusterOptions.onSelect(features);
                }
            });

            MapService.getMap().addInteraction(self.selectClusterInteraction);

            self.selectClusterControl = new anol.control.Control({
                subordinate: true,
                olControl: null,
                interactions: [self.selectClusterInteraction]
            });


            self.selectClusterControl.onDeactivate(function() {
                self.selectClusterInteraction.setActive(false);
                MapService.removeCursorPointerCondition(changeCursorCondition);
            });

            // control active by default
            MapService.addCursorPointerCondition(changeCursorCondition);

            return this.selectClusterControl;
        };

        return new ClusterSelect(_clusterSelectOptions);
    }];
}]);