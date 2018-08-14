require('angular');

import View from 'ol/View.js';
import Point from 'ol/geom/Point';
import LineString from 'ol/geom/LineString';
import Polygon from 'ol/geom/Polygon';
import Feature from 'ol/Feature';

angular.module('example', ['anol', 'anol.map', 'anol.featurepopup', 'anol.zoom', 'anol.layerswitcher', 'anol.permalink'])
.config(['MapServiceProvider', 'LayersServiceProvider',
	function(MapServiceProvider, LayersServiceProvider) {
		MapServiceProvider.addView(new View({
			center: [914764, 7011016],
			zoom: 18
		}));

		var wmsColor = new anol.layer.SingleTileWMS({
			name: 'osm',
			title: 'OSM Omniscale',
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

		var wmsGray = new anol.layer.SingleTileWMS({
			name: 'osm_gray',
			title: 'OSM Omniscale Grayscale',
			isBackground: true,
			olLayer: {
				source: {
					url: 'http://maps.omniscale.net/wms/demo/grayscale/service?',
					params: {
						'LAYERS': 'osm',
						'SRS': 'EPSG:3857'
					}
				}
			}
		});

		var point = new Feature({
			geometry: new Point(
				[914764 + -10, 7011016 + -10]
				)
		});

		var line = new Feature({
			geometry: new LineString([
				[914764 + 0, 7011016 + 0],
				[914764 + 50, 7011016 + 50]
				])
		});

		var polygon = new Feature({
			geometry: new Polygon([[
				[914764 + 10, 7011016 + -20],
				[914764 + 10, 7011016 + 0],
				[914764 + 30, 7011016 + 0],
				[914764 + 30, 7011016 + -20],
				[914764 + 10, 7011016 + -20]
				]])
		});


		var group = new anol.layer.Group({
			name: 'features',
			title: 'Features',
			layers: [
			new anol.layer.Feature({
				name: 'pointLayer',
				title: 'Point',
				olLayer: {
					source: {
						features: [point]
					}
				}
			}),
			new anol.layer.Feature({
				name: 'lineLayer',
				title: 'Line',
				olLayer: {
					source: {
						features: [line]
					}
				}
			}),
			new anol.layer.Feature({
				name: 'polygonLayer',
				title: 'Polygon',
				olLayer: {
					source: {
						features: [polygon]
					}
				}
			})
			]
		});
	
		LayersServiceProvider.setLayers([wmsColor, wmsGray, group]);
	}])
 // need to start PermalinkService, can be removed if app using PermalinkDirective (when exist)
 .run(['PermalinkService', function(PermalinkService) {}]);
