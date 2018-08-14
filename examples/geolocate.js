require('angular');

import View from 'ol/View.js';

angular.module('example', ['anol.geolocation', 'anol.zoom', 'anol.featurepopup'])
.config(['MapServiceProvider', 'LayersServiceProvider',
  function(MapServiceProvider, LayersServiceProvider) {
    MapServiceProvider.addView(new View({
      center: [914764, 7011016],
      zoom: 4
    }));

    var wms = new anol.layer.SingleTileWMS({
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
    LayersServiceProvider.setLayers([wms]);
  }]);