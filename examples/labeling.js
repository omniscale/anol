require('angular');

import View from 'ol/View.js';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.attribution', 'anol.featureproperties'])
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

  var propertyLabelFeature1 = new Feature({
    geometry: new Point([-40, 0]),
    name: 'Feature 1',
    other: 'other label',
    style: {
      propertyLabel: 'other'
    }
  });

  var propertyLabelFeature2 = new Feature({
    geometry: new Point([0, 0]),
    name: 'Feature 2',
    style: {
      text: 'Overwritten',
      fontColor: 'rgba(0, 255, 0, 0.1)'
    }
  });

  var propertyLabelFeature3 = new Feature({
    geometry: new Point([40, 0]),
    name: 'Feature 3',
    style: {
      fontColor: '#00f'
    }
  });

  var propertyLabelFeatureLayer = new anol.layer.Feature({
    name: 'featureLayer',
    style: {
      radius: 0,
      propertyLabel: 'name',
      fontColor: '#f00'
    },
    olLayer: {
      source: {
        features: [propertyLabelFeature1, propertyLabelFeature2, propertyLabelFeature3]
      }
    }
  });

  LayersService.addOverlayLayer(propertyLabelFeatureLayer);
}]);