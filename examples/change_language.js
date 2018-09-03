require('angular');
require('angular-translate');

import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON.js'

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.attribution', 'anol.layerswitcher', 'anol.draw', 'anol.featurestyleeditor'])
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
.config(['$translateProvider', function($translateProvider) {
    // define location of language jsons to load
    $translateProvider.useStaticFilesLoader({
          files: [{
            'prefix': 'data/',
            'suffix': '.json'
          }
          ]
        });
    $translateProvider.preferredLanguage('de_DE');
}])
.controller('DrawExampleController', ['$rootScope', '$scope', '$translate', 'LayersService', function($rootScope, $scope, $translate, LayersService) {
  var geojsonFormat = new GeoJSON();
  $scope.drawLayer = new anol.layer.StaticGeoJSON();
  LayersService.addOverlayLayer($scope.drawLayer);
  $scope.drawLayer.olLayer.getSource().on('change', function() {
    $scope.features = geojsonFormat.writeFeaturesObject($scope.drawLayer.olLayer.getSource().getFeatures());
  });

  $rootScope.$on('$translateChangeSuccess', function () {
    $translate(['ENGLISH', 'GERMAN']).then(function(translations) {
      $scope.languages = [
      {value: 'en_US', label: translations.ENGLISH},
      {value: 'de_DE', label: translations.GERMAN}
      ];
    });
  });

  $scope.language = 'de_DE';

  $scope.$watch('language', function(n) {
    $translate.use(n);
  });

}]);
