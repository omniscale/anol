describe('Testing map module', function() {

  var BACKGROUND_LAYER, OVERLAY_LAYER, VIEW;

  beforeEach(module('anol.map'));

  beforeEach(function() {
    BACKGROUND_LAYER = new anol.layer.TiledWMS({
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

    OVERLAY_LAYER = new anol.layer.TiledWMS({
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

    VIEW = new ol.View({
      projection: 'EPSG:4326',
      center: [8.2175, 53.1512],
      zoom: 14
    });
  });

  describe('Testing LayersService', function() {
    // TODO test addLayerHandler

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

  describe('Testing ControlsService', function() {
    // TODO add ControlsServiceProviderTest
    var controlsService, CONTROL, EXCLUSIVE_CONTROL, SUBORDINATE_CONTROL;

    beforeEach(function() {
      inject(function($injector) {
        controlsService = $injector.get('ControlsService');
      });

      CONTROL = new anol.control.Control({});
      EXCLUSIVE_CONTROL = new anol.control.Control({
        exclusive: true
      });
      SUBORDINATE_CONTROL = new anol.control.Control({
        subordinate: true
      });
    });

    it('should have rotationControl wrapped in anol.control.Control', function() {
      expect(controlsService.controls.length).toBe(1);
      expect(controlsService.controls[0] instanceof anol.control.Control).toBe(true);
      expect(controlsService.controls[0].olControl instanceof ol.control.Rotate).toBe(true);
    });

    it('should add controls', function() {
      var addControlSpy = spyOn(controlsService, 'addControl').and.callThrough();
      controlsService.addControls([
        CONTROL,
        EXCLUSIVE_CONTROL,
        SUBORDINATE_CONTROL
      ]);
      expect(addControlSpy.calls.count()).toBe(3);
      expect(controlsService.controls.length).toBe(4);
    });

    describe('Testing activate / deactivate controls', function() {
      var CONTROL_2, EXCLUSIVE_CONTROL_2, SUBORDINATE_CONTROL_2;

      beforeEach(function() {

        CONTROL_2 = new anol.control.Control({});
        EXCLUSIVE_CONTROL_2 = new anol.control.Control({
          exclusive: true
        });
        SUBORDINATE_CONTROL_2 = new anol.control.Control({
          subordinate: true
        });

        controlsService.addControls([
          CONTROL,
          CONTROL_2,
          EXCLUSIVE_CONTROL,
          EXCLUSIVE_CONTROL_2,
          SUBORDINATE_CONTROL,
          SUBORDINATE_CONTROL_2
        ]);
      });

      it('should have no active non default control', function() {
        // 0 is default control (Rotate)
        expect(controlsService.controls[0].active).toBe(true);
        // just added controls
        expect(CONTROL.active).toBe(false);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(false);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);
      });

      it('should activate a control', function() {
        CONTROL.activate();

        // 0 is default control (Rotate)
        expect(controlsService.controls[0].active).toBe(true);
        // just added controls
        expect(CONTROL.active).toBe(true);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(false);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);
      });

      it('should keep normal controls active', function() {
        CONTROL.activate();
        CONTROL_2.activate();
        expect(CONTROL.active).toBe(true);
        expect(CONTROL_2.active).toBe(true);
        expect(EXCLUSIVE_CONTROL.active).toBe(false);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);

        SUBORDINATE_CONTROL.activate();
        expect(CONTROL.active).toBe(true);
        expect(CONTROL_2.active).toBe(true);
        expect(EXCLUSIVE_CONTROL.active).toBe(false);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(true);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);

        EXCLUSIVE_CONTROL.activate();
        expect(CONTROL.active).toBe(true);
        expect(CONTROL_2.active).toBe(true);
        expect(EXCLUSIVE_CONTROL.active).toBe(true);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);
      });

      it('should have only one active exclusive control at a time', function() {
        EXCLUSIVE_CONTROL.activate();
        expect(CONTROL.active).toBe(false);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(true);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);

        EXCLUSIVE_CONTROL_2.activate();
        expect(CONTROL.active).toBe(false);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(false);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(true);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);
      });

      it('should deactivate all subordinate controls when exclusive control activated', function() {
        SUBORDINATE_CONTROL.activate();
        SUBORDINATE_CONTROL_2.activate();
        expect(CONTROL.active).toBe(false);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(false);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(true);
        expect(SUBORDINATE_CONTROL_2.active).toBe(true);

        EXCLUSIVE_CONTROL.activate();
        expect(CONTROL.active).toBe(false);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(true);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);
      });

      it('should activate subordinate controls when exclusiv control deactivated', function() {
        EXCLUSIVE_CONTROL.activate();
        expect(CONTROL.active).toBe(false);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(true);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(false);
        expect(SUBORDINATE_CONTROL_2.active).toBe(false);

        EXCLUSIVE_CONTROL.deactivate();
        expect(CONTROL.active).toBe(false);
        expect(CONTROL_2.active).toBe(false);
        expect(EXCLUSIVE_CONTROL.active).toBe(false);
        expect(EXCLUSIVE_CONTROL_2.active).toBe(false);
        expect(SUBORDINATE_CONTROL.active).toBe(true);
        expect(SUBORDINATE_CONTROL_2.active).toBe(true);
      });
    });
  });

  describe('Testing InteractionsService', function() {
    var interactionsService;

    beforeEach(function() {
      inject(function($injector) {
        interactionsService = $injector.get('InteractionsService');
      });
    });

    // TODO write tests
  });

  describe('Testing MapDirecitve', function() {
    var CONTROL, CONTROL_2;
    var directiveElement, $compile, $rootScope, $scope, $timeout, mapService, olMap, addControlSpy;

    beforeEach(function() {
      module(function(LayersServiceProvider) {
        LayersServiceProvider.setLayers([
          BACKGROUND_LAYER,
          OVERLAY_LAYER
        ]);
      });

      CONTROL = new anol.control.Control({});
      CONTROL_2 = new anol.control.Control({});

      module(function(ControlsServiceProvider) {
        ControlsServiceProvider.setControls([
          CONTROL,
          CONTROL_2
        ]);
      });

      module(function(MapServiceProvider) {
        MapServiceProvider.addView(VIEW);
      });

      inject(function($injector) {
        $rootScope = $injector.get('$rootScope');
        $scope = $rootScope.$new();
        $compile = $injector.get('$compile');
        $timeout = $injector.get('$timeout');
        mapService = $injector.get('MapService');
      });

      var element = '<div anol-map></div>';
      directiveElement = $compile(element)($scope);
      $scope.$digest();

      olMap = directiveElement.isolateScope().map;
      // olMap.addControl make dom operations on not existing elements in this test
      // so we need a spy
      addControlSpy = spyOn(olMap, 'addControl');

      $timeout.flush();
    });

    it('should have added default id and class to element', function() {
      expect(directiveElement.attr('id')).toBe('anol-map');
      expect(directiveElement.hasClass('anol-map')).toBe(true);
    });

    it('should have an olMap with defined layers and controls', function() {
      expect(olMap instanceof ol.Map).toBe(true);
      expect(mapService.getMap()).toEqual(olMap);

      var layers = olMap.getLayers();
      expect(layers.getLength()).toBe(2);
      expect(layers.item(0)).toEqual(BACKGROUND_LAYER.olLayer);
      expect(layers.item(1)).toEqual(OVERLAY_LAYER.olLayer);

      expect(addControlSpy.calls.count()).toBe(2);
    });
  });

});