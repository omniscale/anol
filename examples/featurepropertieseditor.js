require('angular');

import View from 'ol/View';
import GeoJSON from 'ol/format/GeoJSON.js'

angular.module('example', ['anol.featurepopup', 'anol.featurepropertieseditor', 'anol.zoom'])
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
		LayersServiceProvider.setLayers();
	}])
.controller('ExampleController', ['$scope', 'LayersService', function($scope, LayersService) {
	var geojsonFormat = new GeoJSON();
	var featureLayer = new anol.layer.StaticGeoJSON({
		name: 'feature_layer',
		title: 'Feature Layer',
		editable: true,
		olLayer: {
			source: {
				url: 'data/example.geojson'
			}
		}
	});
	LayersService.addOverlayLayer(featureLayer);
	featureLayer.olLayer.getSource().on('change', function() {
		$scope.features = geojsonFormat.writeFeaturesObject(featureLayer.olLayer.getSource().getFeatures());
	});
	$scope.popupLayers = [featureLayer];
}]);