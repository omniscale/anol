require('angular');

import View from 'ol/View';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4.js';
import {transformExtent, transform} from 'ol/proj';

proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");
register(proj4);

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.attribution', 'anol.layerswitcher', 'anol.permalink', 'anol.scale'])
    .config(['MapServiceProvider', 'LayersServiceProvider',
        function(MapServiceProvider, LayersServiceProvider) {
         var test = {
            'center': [468152.5616, 5764386.17546],
            'centerProjection': "EPSG:25832",
            'zoom': 15,
            'projection': "EPSG:25832",
            'projectionExtent': [-46133.17, 5048875.26857567, 1206211.10142433, 6301219.54],
            'maxExtent': [371030.56,5672454.87,562875.71,5818346.28],
            'minZoom': 6,
            'maxZoom': 15
          }
          MapServiceProvider.addView(new View({
            projection: test.projection,
            center: transform(
              test.center || [0, 0],
              test.centerProjection || 'EPSG:4326',
              test.projection
            ),
            zoom: test.zoom || 0,
            minZoom: test.minZoom,
            maxZoom: test.maxZoom,
            extent: test.maxExtent
          }));

          var wms = new anol.layer.TiledWMS({
            attribution: '© 2015 Omniscale • Map Data: OpenStreetMap - (License: ODbL)',
            title: 'OSM Omniscale',
            isBackground: true,
            olLayer: {
              source: {
                url: 'http://maps.omniscale.net/wms/demo/default/service?',
                params: {
                  'LAYERS': 'osm',
                  'SRS': 'EPSG:25832'
                }
              }
            }
          });
          
          var wmsGray = new anol.layer.TiledWMS({
            title: 'OSM Omniscale Grayscale',
            attribution: '© 2015 Omniscale • Map Data: OpenStreetMap - (License: ODbL)',
            isBackground: true,
            olLayer: {
              source: {
                url: 'http://maps.omniscale.net/wms/demo/grayscale/service?',
                params: {
                  'LAYERS': 'osm',
                  'SRS': 'EPSG:25832'
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
      }])
 .run(['PermalinkService', function(PermalinkService) {}]);
