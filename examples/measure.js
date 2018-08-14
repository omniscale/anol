require('angular');

import View from 'ol/View.js';
import Style from 'ol/style/Style';
import Stroke from 'ol/style/Stroke';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.measure'])
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
.controller('exampleController', ['$scope', function($scope) {
  $scope.lineStyle = new Style({
    stroke: new Stroke({
      color: '#ffccdd',
      width: 4
    })
  });
}]);