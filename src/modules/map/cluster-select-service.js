angular.module('anol.map')

/**
 * @ngdoc object
 * @name anol.map.ClusterSelectServiceProvider
 */
.provider('ClusterSelectService', [function() {
    this.$get = ['MapService', function(MapService) {

        var defaultClusterOptions = {
            selectCluster: true,
            pointRadius: 7,
            spiral: true,
            circleMaxObjects: 10,
            maxObjects: 60,
            animate: true,
            animationDuration: 500,
        };

        var defaultUnclusteredStyle = new ol.style.Circle({
            radius: 5,
            stroke: new ol.style.Stroke({
                color: "rgba(0,255,255,1)",
                width: 1
            }),
            fill: new ol.style.Fill({
                color: "rgba(0,255,255,0.3)"
            })
        });

        var defaultSelectClusteredStyle = new ol.style.Style({
            image: new ol.style.Circle({
                radius: 10,
                stroke: new ol.style.Stroke({
                    color: "rgba(255,255,0,1)",
                    width: 1
                }),
                fill: new ol.style.Fill({
                    color: "rgba(255,255,0,0.3)"
                })
            })
        });

        var ClusterSelect = function() {
            this.clusterLayers = [];
        };

        ClusterSelect.prototype.addLayer = function(layer) {
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
                    resultLayer = layer;
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
            self.selectClusterInteraction = new ol.interaction.SelectCluster($.extend({}, defaultClusterOptions, {
                layers: olClusterLayers,
                featureStyle: function(clusterFeature, resolution) {
                    // for each feature represented by selected cluster a feature with
                    // features property containing the original feature is returned.
                    // the only feature without a features property is the clusterFeature
                    // representing n features
                    var clusteredFeature = clusterFeature.get('features');
                    if(clusteredFeature === undefined) {
                        return;
                    }
                    var feature = clusteredFeature[0];
                    var layer = self.layerByFeature(feature);
                    var layerStyle = layer.olLayer.getStyle();
                    if(angular.isFunction(layerStyle)) {
                        layerStyle = layerStyle(feature, resolution)[0];
                    }
                    var imageStyle = layerStyle.getImage();
                    return [
                        new ol.style.Style({
                            image: imageStyle ? imageStyle : defaultUnclusteredStyle,
                            // Draw a link beetween points (or not)
                            stroke: new ol.style.Stroke({
                                color: "#fff",
                                width: 1
                            })
                        })
                    ];
                },
                style: function(clusterFeature, resolution) {
                    // clusterFeature is the feature representing n features
                    var layer = self.layerByFeature(clusterFeature.get('features')[0]);
                    var selectClusterStyle = layer.clusterOptions.selectClusterStyle;
                    if(angular.isFunction(selectClusterStyle)) {
                        selectClusterStyle = selectClusterStyle(clusterFeature, resolution)[0];
                    }
                    return [
                        selectClusterStyle || defaultSelectClusteredStyle
                    ];
                }
            }));

            self.selectClusterInteraction.getFeatures().on('add', function(e) {
                var features = e.element.get('features');
                var layer = self.layerByFeature(features[0]);
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

            var changeCursorCondition = function(pixel) {
                return MapService.getMap().hasFeatureAtPixel(pixel, function(layer) {
                    var anolLayer = layer.get('anolLayer');
                    if(anolLayer === undefined) {
                        return false;
                    }
                    return anolLayer.isClustered();
                });
            };

            self.selectClusterControl.onDeactivate(function() {
                self.selectClusterInteraction.setActive(false);
                MapService.removeCursorPointerCondition(changeCursorCondition);
            });
            self.selectClusterControl.onActivate(function() {
                self.selectClusterInteraction.setActive(true);
                MapService.addCursorPointerCondition(changeCursorCondition);
            });

            // control active by default
            MapService.addCursorPointerCondition(changeCursorCondition);

            return this.selectClusterControl;
        };

        return new ClusterSelect();
    }];
}]);