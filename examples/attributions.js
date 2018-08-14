require('angular');

import View from 'ol/View.js';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.attribution', 'anol.layerswitcher'])
    .config(['MapServiceProvider', 'LayersServiceProvider',
        function(MapServiceProvider, LayersServiceProvider) {
          MapServiceProvider.addView(new View({
            center: [914764, 7011016],
            zoom: 18
          }));

          var wms = new anol.layer.TiledWMS({
            attribution: '© 2015 Omniscale • Map Data: OpenStreetMap - (License: ODbL)',
            title: 'OSM Omniscale',
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
          
          var wmsGray = new anol.layer.TiledWMS({
            title: 'OSM Omniscale Grayscale',
            attribution: '© 2015 Omniscale • Map Data: OpenStreetMap - (License: ODbL)',
            olLayer: {
              source: {
                url: 'http://maps.omniscale.net/wms/demo/grayscale/service?',
                params: {
                  'LAYERS': 'osm',
                  'SRS': 'EPSG:3857'
                }
              }
            }
          });

          var point = new Feature({
            geometry: new Point(
              [914764 + -10, 7011016 + -10]
            )
          });

          var line = new Feature({
            geometry: new LineString([
              [914764 + 0, 7011016 + 0],
              [914764 + 50, 7011016 + 50]
            ])
          });

          var polygon = new Feature({
            geometry: new Polygon([[
              [914764 + 10, 7011016 + -20],
              [914764 + 10, 7011016 + 0],
              [914764 + 30, 7011016 + 0],
              [914764 + 30, 7011016 + -20],
              [914764 + 10, 7011016 + -20]
            ]])
          });

          var featureLayer = new anol.layer.Feature({
            name: 'featureLayer',
            title: 'Feature Layer',
            attribution: '© 2015 Omniscale - Feature',
            olLayer: {
              source: {
                features: [point, line]
              }
            }
          });
          var otherFeatureLayer = new anol.layer.Feature({
            name: 'otherFeatureLayer',
            title: 'Other Feature Layer',
            attribution: '© 2015 Omniscale - Feature',
            olLayer: {
              source: {
                features: [polygon]
              }
            }
          });
          var group = new anol.layer.Group({
            name: 'features',
            title: 'Features',
            layers: [featureLayer, otherFeatureLayer]
          });
          LayersServiceProvider.setLayers([group, wmsGray, wms]);
      }]);