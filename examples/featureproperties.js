require('angular');

import View from 'ol/View.js';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

angular.module('example', ['anol.featurepopup', 'anol.featureproperties', 'anol.zoom'])
.config(['$translateProvider', function($translateProvider) {
  $translateProvider.translations('en_US', {
    'featureproperties': {
      'featureLayer': {
        'DESCRIPTION': 'Beschreibung',
        'description': {
          'I am a feature': 'Ich bin ein Feature'
        }
      }
    }
  });
}])
.config(['MapServiceProvider',function(MapServiceProvider) {
  MapServiceProvider.addView(new View({
    center: [0, 0],
    zoom: 18
  }));
}])
.controller('ExampleController', ['$scope', 'LayersService', function($scope, LayersService) {

  var feature = new Feature({
    geometry: new Point([0, 0]),
    name: 'Feature',
    description: 'I am a feature'
  });

  var anotherFeature = new Feature({
    geometry: new Point([10, 10]),
    name: '',
    description: 'I am a feature'
  });

  var overlappingFeature = new Feature({
    geometry: new Point([10, 10]),
    name: '',
    description: 'I am overlapping'
  });

  var oneFeatureMore = new Feature({
    geometry: new Point([-10, 10]),
    name: '',
    description: ''
  });

  var featureLayer = new anol.layer.Feature({
    name: 'featureLayer',
    featureinfo: {
      properties: ['name', 'description']
    },
    olLayer: {
      source: {
        features: [feature, anotherFeature, overlappingFeature, oneFeatureMore]
      }
    }
  });

  var polygon = new Feature({
    name: 'Polygon',
    geometry: new Polygon([[
      [-15, -15],
      [-15, 15],
      [15, 15],
      [15, -15],
      [-15, -15]
      ]])
  });

  var featureLayer2 = new anol.layer.Feature({
    name: 'featureLayer2',
    featureinfo: {
      properties: ['name']
    },
    olLayer: {
      source: {
        features: [polygon]
      }
    }
  });

  LayersService.addOverlayLayer(featureLayer2);
  LayersService.addOverlayLayer(featureLayer);


  $scope.popupLayers = [featureLayer, featureLayer2];
}]);