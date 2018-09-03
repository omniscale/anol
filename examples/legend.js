require('angular');

import View from 'ol/View';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.attribution', 'anol.layerswitcher', 'anol.legend'])
.config(['MapServiceProvider', 'LayersServiceProvider',
  function(MapServiceProvider, LayersServiceProvider) {
    MapServiceProvider.addView(new View({
      center: [0, 0],
      zoom: 18
    }));

    var wms = new anol.layer.SingleTileWMS({
      name: 'osm',
      title: 'OSM Omniscale',
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

    var point = new Feature({
      geometry: new Point(
        [-10, -10]
        )
    });

    var line = new Feature({
      geometry: new LineString([
        [0, 0],
        [50, 50]
        ])
    });

    var polygon = new Feature({
      geometry: new Polygon([[
        [10, -20],
        [10, 0],
        [30, 0],
        [30, -20],
        [10, -20]
        ]])
    });

    var pointLayer = new anol.layer.Feature({
      name: 'pointLayer',
      title: 'Point',
      legend: {
        type: 'point'
      },
      olLayer: {
        style: new Style({
          image: new Icon({
            src: 'data/rail-18.svg',
            imgSize: [18, 18]
          })
        }),
        source: {
          features: [point]
        }
      }
    });

    var lineLayer = new anol.layer.Feature({
      name: 'lineLayer',
      title: 'Line',
      legend: {
        url: 'data/rail-18.svg',
        imgSize: [18, 18]
      },
      olLayer: {
        source: {
          features: [line]
        }
      }
    });

    var polygonLayer = new anol.layer.Feature({
      name: 'polygonLayer',
      title: 'Polygon',
      legend: {
        type: 'polygon'
      },
      olLayer: {
        source: {
          features: [polygon]
        }
      }
    });

    LayersServiceProvider.setLayers([wms, pointLayer, lineLayer, polygonLayer]);
  }]);
