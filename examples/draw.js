require('angular');

import View from 'ol/View.js';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom'])
.config(['MapServiceProvider', 'LayersServiceProvider',
  function(MapServiceProvider, LayersServiceProvider) {
    MapServiceProvider.addView(new View({
      center: [914764, 7011016],
      zoom: 13
    }));

    var wms = new anol.layer.SingleTileWMS({
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
    var drawLayer1 = new anol.layer.StaticGeoJSON({
      name: 'draw_layer_1',
      title: 'Draw Layer 1',
      editable: true,
      olLayer: {
        source: {
          url: 'data/example.geojson'
        }
      }
    });
    var drawLayer2 = new anol.layer.Feature({
      name: 'draw_layer_2',
      title: 'Draw Layer 2',
      editable: true
    });
    LayersServiceProvider.setLayers([wms, drawLayer1, drawLayer2]);
  }])
.controller('LayersController', ['$scope', 'DrawService', function($scope, DrawService) {
  $scope.layers = DrawService.layers;
  $scope.activeLayer = DrawService.activeLayer;
  $scope.setActive = function(layer) {
    DrawService.changeLayer(layer);
    $scope.activeLayer = DrawService.activeLayer;
  };
}]);