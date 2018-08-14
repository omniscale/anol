require('angular');

import View from 'ol/View.js';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import Feature from 'ol/Feature';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.attribution', 'anol.layerswitcher'])
.config(['MapServiceProvider', 'LayersServiceProvider',
    function(MapServiceProvider, LayersServiceProvider) {
        MapServiceProvider.addView(new View({
            center: [0, 0],
            zoom: 14
        }));

        var iconStyles = [
        new Style({
            image: new CircleStyle({
                fill: new Fill({
                    color: 'rgba(200,0,0,0.4)'
                }),
                stroke: new Stroke({
                    color: 'rgba(200,0,0,1)',
                    width: 1
                }),
                radius: 3
            }),
            fill: new Fill({
                color: 'rgba(200,0,0,0.4)'
            }),
            stroke: new Stroke({
                color: 'rgba(200,0,0,1)',
                width: 1
            })
        }),
        new Style({
            image: new CircleStyle({
                fill: new Fill({
                    color: 'rgba(0,200,0,0.4)'
                }),
                stroke: new Stroke({
                    color: 'rgba(0,200,0,1)',
                    width: 1
                }),
                radius: 3
            }),
            fill: new Fill({
                color: 'rgba(0,200,0,0.4)'
            }),
            stroke: new Stroke({
                color: 'rgba(0,200,0,1)',
                width: 1
            })
        }),
        new Style({
            image: new CircleStyle({
                fill: new Fill({
                    color: 'rgba(0,0,200,0.4)'
                }),
                stroke: new Stroke({
                    color: 'rgba(0,0,200,1)',
                    width: 1
                }),
                radius: 3
            }),
            fill: new Fill({
                color: 'rgba(0,0,200,0.4)'
            }),
            stroke: new Stroke({
                color: 'rgba(0,0,200,1)',
                width: 1
            })
        })
        ];

        var points = [];
        var e = 500;
        var count = 50;
        for (var i = 0; i < count; i++) {
            var coordinates = [
            2 * e * Math.random() - e,
            2 * e * Math.random() - e
            ];
            var f = new Feature({
                geometry: new Point(coordinates),
                id: i
            });
            f.setStyle(iconStyles[i % 3]);
            points.push(f);
        }

        var clusterLayer = new anol.layer.Feature({
            name: 'clusteredLayer',
            cluster: {
                pointRadius: 12,
                clusterStyle: {
                    externalGraphic: 'data/rail-18.svg'
                },
                selectClusterStyle: {
                    strokeColor: '#0f0',
                    strokeWidth: 3,
                    strokeOpacity: 1,
                    fillColor: '#00f',
                    fillOpacity: 0.25,
                    radius: 15
                },
                onSelect: function(features) {
                    if(features.length === 1) {
                        console.log('feature', features[0].get('id'), 'selected');
                    } else {
                        var ids = [];
                        angular.forEach(features, function(f) {
                            ids.push(f.get('id'));
                        });
                        console.log('features with ids', ids, 'selected');
                    }
                }
            },
            olLayer: {
                source: {
                    features: points
                }
            }
        });

        var wms = new anol.layer.TiledWMS({
            isBackground: true,
            olLayer: {
                source: {
                    url: 'http://maps.omniscale.net/wms/demo/default/service?',
                    params: {
                        'LAYERS': 'osm',
                        'SRS': 'EPSG:3857'
                    }
                }
            }
        });
        LayersServiceProvider.setLayers([clusterLayer, wms]);
    }
    ]);