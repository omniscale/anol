proj4.defs("EPSG:25832","+proj=utm +zone=32 +ellps=GRS80 +units=m +no_defs");
var stationLayer;

angular.module('example', ['anol.zoom'])
.config(['MapServiceProvider', 'LayersServiceProvider',
  function(MapServiceProvider, LayersServiceProvider) {
    MapServiceProvider.addView(new ol.View({
      projection: ol.proj.get('EPSG:25832'),
      center: ol.proj.transform(
       [949504, 6803691],
       ol.proj.get('EPSG:3857'),
       ol.proj.get('EPSG:25832')
       ),
      zoom: 18
    }));

    var wms = new anol.layer.TiledWMS({
      olLayer: {
        source: {
          url: 'http://maps.omniscale.net/wms/demo/default/service?',
          params: {
            'LAYERS': 'osm',
            'SRS': 'EPSG:25832'
          }
        }
      }
    });

    stationLayer = new anol.layer.BBOXGeoJSON({
      name: 'selectable_stations',
      displayInLayerswitcher: true,
      featureinfo: {
        properties: ['name', 'routes']
      },
      olLayer: {
       style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(239, 130, 20, 0.5)'
        }),
        stroke: new ol.style.Stroke({
          color: '#EF8214',
          width: 2
        })
      }),
       source: {
        featureProjection: ol.proj.get('EPSG:25832'),
        extentProjection: ol.proj.get('EPSG:4326'),
        dataProjection: ol.proj.get('EPSG:3857'),
        url: "http://localhost:5000/mobiel/stations.geojson?layer=mobiel_day"
      }
    }
  });

    LayersServiceProvider.setLayers([stationLayer, wms]);
  }]);