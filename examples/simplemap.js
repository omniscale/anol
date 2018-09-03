require('angular');

import View from 'ol/View';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom'])
.config(['MapServiceProvider', 'LayersServiceProvider',
  function(MapServiceProvider, LayersServiceProvider) {
    MapServiceProvider.addView(
      new View({
      center: [914764, 7011016],
      zoom: 18
    }));

    var wms = new anol.layer.TiledWMS({
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