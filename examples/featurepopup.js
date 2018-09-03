require('angular');

import View from 'ol/View';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

angular.module('example', ['anol.featurepopup', 'anol.featureproperties', 'anol.zoom'])
.config(['MapServiceProvider',function(MapServiceProvider) {
  MapServiceProvider.addView(new View({
    center: [0, 0],
    zoom: 18
  }));
}])
.controller('ExampleController', ['$scope', 'LayersService', function($scope, LayersService) {
  var polygon = new Feature({
    name: 'This is a polygon',
    geometry: new Polygon([[
      [-15, -15],
      [-15, 15],
      [15, 15],
      [15, -15],
      [-15, -15]
      ]])
  });

  var featureLayer = new anol.layer.Feature({
    name: 'featureLayer',
    featureinfo: {
      properties: ['name']
    },
    olLayer: {
      source: {
        features: [polygon]
      }
    }
  });

  LayersService.addOverlayLayer(featureLayer);

  $scope.popupLayers = [featureLayer];
}]);