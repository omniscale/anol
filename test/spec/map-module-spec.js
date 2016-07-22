describe('Testing map module', function() {

  beforeEach(module('anol.map'));

  describe('Testing LayersService', function() {
    var BACKGROUND_LAYER = new anol.layer.TiledWMS({
      name: 'background',
      title: 'Background',
      isBackground: true,
      olLayer: {
        source: {
          url: 'http://www.example.org?',
          format: 'image/png',
          params: {
            LAYERS: 'example',
            SRS: 'EPSG:4326'
          }
        }
      }
    });

    var OVERLAY_LAYER = new anol.layer.TiledWMS({
      name: 'overlay',
      title: 'Overlay',
      olLayer: {
        source: {
          url: 'http://www.example.org?',
          format: 'image/png',
          params: {
            LAYERS: 'example',
            SRS: 'EPSG:4326'
          }
        }
      }
    });

    var OTHER_OVERLAY_LAYER = new anol.layer.Feature({
      name: 'feature',
      title: 'Feature',
      olLayer: {
        source: {}
      }
    });

    var layersService;

    beforeEach(function () {
      inject(function($injector) {
        layersService = $injector.get('LayersService');
      });
    });

    it('should add a background layer and create olLayer and olSource correct', function() {
      layersService.addBackgroundLayer(BACKGROUND_LAYER);
      expect(layersService.backgroundLayers.length).toBe(1);
      expect(layersService.backgroundLayers[0]).toEqual(BACKGROUND_LAYER);
      expect(BACKGROUND_LAYER.olLayer instanceof ol.layer.Tile).toBe(true);
      expect(BACKGROUND_LAYER.olLayer.getSource() instanceof ol.source.TileWMS).toBe(true);
      expect(layersService.activeBackgroundLayer()).toEqual(BACKGROUND_LAYER);
      expect(layersService.layerByName('background')).toEqual(BACKGROUND_LAYER);
    });

    it('should add a overlay layer and create olLayer and olSource correct', function() {
      layersService.addOverlayLayer(OVERLAY_LAYER);
      expect(layersService.overlayLayers.length).toBe(1);
      expect(layersService.overlayLayers[0]).toEqual(OVERLAY_LAYER);
      expect(OVERLAY_LAYER.olLayer instanceof ol.layer.Tile).toBe(true);
      expect(OVERLAY_LAYER.olLayer.getSource() instanceof ol.source.TileWMS).toBe(true);
      expect(layersService.layerByName('overlay')).toEqual(OVERLAY_LAYER);
    });

    it('should add a group of overlay layers correct', function() {
      var GROUP = new anol.layer.Group({
        name: 'group',
        title: 'Group',
        layers: [
          OVERLAY_LAYER,
          OTHER_OVERLAY_LAYER
        ]
      });
      layersService.addOverlayLayer(GROUP);
      expect(layersService.overlayLayers[0]).toEqual(GROUP);
      expect(layersService.groupByName('group')).toEqual(GROUP);
      expect(layersService.layerByName('overlay')).toEqual(OVERLAY_LAYER);
      expect(layersService.layerByName('feature')).toEqual(OTHER_OVERLAY_LAYER);
    });

    it('should have same source for both layers', function() {
      layersService.addBackgroundLayer(BACKGROUND_LAYER);
      expect(layersService.backgroundLayers.length).toBe(1);
      layersService.addOverlayLayer(OVERLAY_LAYER);
      expect(layersService.overlayLayers.length).toBe(1);

      expect(layersService.backgroundLayers[0].olLayer.getSource()).toEqual(layersService.overlayLayers[0].olLayer.getSource());
    });

    it('should add background ol layer below overlay ol layer', function() {
      layersService.addOverlayLayer(OVERLAY_LAYER);
      layersService.addBackgroundLayer(BACKGROUND_LAYER);

      expect(layersService.backgroundLayers[0]).toEqual(layersService.layers()[0]);
      expect(layersService.overlayLayers[0]).toEqual(layersService.layers()[1]);
    });
  });

  describe('Testing MapService', function() {

    var VIEW = new ol.View({
      projection: 'EPSG:4326',
      center: [8.2175, 53.1512],
      zoom: 14
    });

    var mapService;

    beforeEach(function() {
      module(function(MapServiceProvider) {
        MapServiceProvider.addView(VIEW);
      });

      inject(function($injector) {
        mapService = $injector.get('MapService');
      });
    });

    it('should create a ol map without anything', function() {
      var olMap = mapService.getMap();
      expect(olMap instanceof ol.Map).toBe(true);
      expect(olMap.getView()).toEqual(VIEW);
      expect(olMap.getControls().getLength()).toBe(0);
      expect(olMap.getInteractions().getLength()).toBe(0);
      expect(olMap.getLayers().getLength()).toBe(0);
      expect(olMap.getTarget()).toBe(undefined);
    });

    it('should add, execute and remove pointer condition callback', function() {
      var targetStyle = {style: {}};
      var olMap = mapService.getMap();
      // mock used olMap functions
      var getEventPixelSpy = spyOn(olMap, 'getEventPixel').and.returnValue([123, 321]);
      var getTargetSpy = spyOn(olMap, 'getTarget').and.returnValue(targetStyle);
      var cursorPointerConditionSpy = jasmine.createSpy('pointerCondition').and.returnValues(false, true);

      mapService.addCursorPointerCondition(cursorPointerConditionSpy);

      expect(getEventPixelSpy).not.toHaveBeenCalled();
      expect(getTargetSpy).not.toHaveBeenCalled();
      expect(cursorPointerConditionSpy).not.toHaveBeenCalled();

      olMap.dispatchEvent('pointermove');

      expect(getEventPixelSpy).toHaveBeenCalled();
      expect(getTargetSpy).toHaveBeenCalled();
      expect(cursorPointerConditionSpy).toHaveBeenCalled();
      expect(targetStyle.style).toEqual({cursor: ''});

      olMap.dispatchEvent('pointermove');

      expect(getEventPixelSpy.calls.count()).toBe(2);
      expect(getTargetSpy.calls.count()).toBe(2);
      expect(cursorPointerConditionSpy.calls.count()).toBe(2);
      expect(targetStyle.style).toEqual({cursor: 'pointer'});

      mapService.removeCursorPointerCondition(cursorPointerConditionSpy);

      olMap.dispatchEvent('pointermove');

      expect(getEventPixelSpy.calls.count()).toBe(2);
      expect(getTargetSpy.calls.count()).toBe(2);
      expect(cursorPointerConditionSpy.calls.count()).toBe(2);
    });
  });

});