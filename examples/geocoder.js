require('angular');
import View from 'ol/View';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.geocoder', 'anol.urlmarkers'])
.config(['MapServiceProvider', 'LayersServiceProvider',
  function(MapServiceProvider, LayersServiceProvider) {
    MapServiceProvider.addView(new View({
      center: [914764, 7011016],
      zoom: 18
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
  }])
.controller('ExampleController', function($scope) {
  $scope.nominatimOptions = {};
  $scope.geocoderMarkerStyle = {
    externalGraphic: '/static/img/anol-geolocate-marker.svg',
    graphicWidth: 32,
    graphicHeight: 50,
    graphicYAnchor: 50,
    scale: 0.5
  };
});