describe('Testing print module', function() {

  beforeEach(module('anol.print'));

  describe('Testing PrintServiceProvider in direct mode', function() {
    var $rootScope, $httpBackend, provider;
    var CALLBACKS = {
      PREPARE_PRINT_ARGS: function(rawPrintArgs) {
        return rawPrintArgs;
      }
    };
    var MODE = 'direct';
    var PRINT_URL = '/print';
    var PREFIX = 'prefix-';

    beforeEach(function() {
      // create a spy on callback and advice spy to call original function when called
      spyOn(CALLBACKS, 'PREPARE_PRINT_ARGS').and.callThrough();

      // set PrintService options
      module(function(PrintServiceProvider) {
        PrintServiceProvider.setPreparePrintArgs(CALLBACKS.PREPARE_PRINT_ARGS);
        PrintServiceProvider.setMode(MODE);
        PrintServiceProvider.setDownloadPrefix(PREFIX);
        PrintServiceProvider.setPrintUrl(PRINT_URL);
      });

      inject(function($injector) {
        // mocked http backend
        $httpBackend = $injector.get('$httpBackend');
        // print endpoint and its response
        $httpBackend
          .when('POST', PRINT_URL)
          .respond(200, 'test data');
        // mocked rootScope
        $rootScope = $injector.get('$rootScope');
        // create PrintService
        provider = $injector.get('PrintService');
      });
    });

    // clean up
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have the configured values', function() {
      expect(provider.printUrl).toBe(PRINT_URL);
      expect(provider.mode).toBe(MODE);
      expect(provider.preparePrintArgs).toEqual(CALLBACKS.PREPARE_PRINT_ARGS);
      expect(provider.downloadPrefix).toBe(PREFIX);
      expect(provider.checkUrlAttribute).toBe(undefined);
      expect(provider.downloadReady).toEqual(undefined);
    });

    it('should request print endpoint', function() {
      // create spy for print promise resolve and passed resolved data to printResult
      // so we can analyse them
      var printResult;
      var printResultHandler = jasmine.createSpy('success').and.callFake(function(result) {
        printResult = result;
      });
      // ensure spies not called yet
      expect(CALLBACKS.PREPARE_PRINT_ARGS).not.toHaveBeenCalled();
      expect(printResultHandler).not.toHaveBeenCalled();
      var PRINT_ARGS = {
        bbox: [8, 52, 9, 53],
        layers: ['foobar'],
        projection: 'EPSG:4326'
      };
      // setup return value from print endpoint
      $httpBackend.expectPOST(PRINT_URL, PRINT_ARGS);

      // do print action
      provider.startPrint(PRINT_ARGS).then(printResultHandler);

      // ensure callback is called with expected argument
      expect(CALLBACKS.PREPARE_PRINT_ARGS).toHaveBeenCalledWith(PRINT_ARGS);

      // resolve all http calls
      $httpBackend.flush();
      // run $digest cycle otherwise promises not resolved
      $rootScope.$digest();

      // ensure promise is resolved
      expect(printResultHandler).toHaveBeenCalled();

      // analyse print response
      expect(printResult.mode).toBe('direct');
      // TODO test blob content instead of blob url
      expect(printResult.url).toMatch(/blob:http:\/\/localhost:\d{4}\/.+/);
      // .undefined because preparePrintArgs doesn't add "fileEnding" in this test
      expect(printResult.name).toMatch(new RegExp(PREFIX + '\\d+\\.undefined'));
    });
  });

  describe('Testing PrintServiceProvider in queue mode', function() {
    var $rootScope, $httpBackend, $timeout, provider;
    var CALLBACKS = {
      PREPARE_PRINT_ARGS: function(rawPrintArgs) {
        return rawPrintArgs;
      },
      DOWNLOAD_READY: function() {}
    };
    var MODE = 'queue';
    var PRINT_URL = '/print';
    var CHECK_URL = '/check';
    var DOWNLOAD_URL = '/download';
    var PREFIX = 'prefix-';
    var CHECK_URL_ATTRIBUTE = 'checkUrl';

    beforeEach(function() {
      // create a spy on callback and advice spy to call original function when called
      spyOn(CALLBACKS, 'PREPARE_PRINT_ARGS').and.callThrough();
      // on third call the download should be ready
      spyOn(CALLBACKS, 'DOWNLOAD_READY').and.callThrough().and.returnValues(false, false, DOWNLOAD_URL);

      // set PrintService options
      module(function(PrintServiceProvider) {
        PrintServiceProvider.setPreparePrintArgs(CALLBACKS.PREPARE_PRINT_ARGS);
        PrintServiceProvider.setMode(MODE);
        PrintServiceProvider.setDownloadPrefix(PREFIX);
        PrintServiceProvider.setPrintUrl(PRINT_URL);
        PrintServiceProvider.setDownloadReady(CALLBACKS.DOWNLOAD_READY);
        PrintServiceProvider.setCheckUrlAttribute(CHECK_URL_ATTRIBUTE);
      });

      inject(function($injector) {
        // mocked http backend
        $httpBackend = $injector.get('$httpBackend');
        // print endpoints and their responses
        $httpBackend
          .when('POST', PRINT_URL)
          .respond(200, {
            checkUrl: CHECK_URL
          });
        $httpBackend
          .when('GET', CHECK_URL)
          // we don't need to put values into, because DOWNLOAD_READY is called
          // with the result and we can mock DOWNLOAD_READY return values
          .respond(200, {});
        // mocked rootScope
        $rootScope = $injector.get('$rootScope');
        // mocked timeout
        $timeout = $injector.get('$timeout');
        // create PrintService
        provider = $injector.get('PrintService');
        spyOn(provider, 'checkDownload').and.callThrough();
      });
    });

    // clean up
    afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
    });

    it('should have the configured values', function() {
      expect(provider.printUrl).toBe(PRINT_URL);
      expect(provider.mode).toBe(MODE);
      expect(provider.preparePrintArgs).toEqual(CALLBACKS.PREPARE_PRINT_ARGS);
      expect(provider.downloadPrefix).toBe(PREFIX);
      expect(provider.checkUrlAttribute).toBe(CHECK_URL_ATTRIBUTE);
      expect(provider.downloadReady).toEqual(CALLBACKS.DOWNLOAD_READY);
    });

    it('should request print endpoint', function() {
      // create spy for print promise resolve
      var printResultHandler = jasmine.createSpy('success');
      // ensure spies not called yet
      expect(CALLBACKS.PREPARE_PRINT_ARGS).not.toHaveBeenCalled();
      expect(printResultHandler).not.toHaveBeenCalled();
      var PRINT_ARGS = {
        bbox: [8, 52, 9, 53],
        layers: ['foobar'],
        projection: 'EPSG:4326'
      };
      // setup return value from print endpoint
      $httpBackend.expectPOST(PRINT_URL, PRINT_ARGS);

      // do print action
      provider.startPrint(PRINT_ARGS).then(printResultHandler);

      // ensure callback is called with expected argument
      expect(CALLBACKS.PREPARE_PRINT_ARGS).toHaveBeenCalledWith(PRINT_ARGS);
      // resolve all http calls
      $httpBackend.flush();
      // run $digest cycle otherwise promises not resolved
      $rootScope.$digest();

      expect(provider.checkDownload).toHaveBeenCalledWith(CHECK_URL);

      // first to calls of DOWNLOAD_READY return false,
      // so internaly it's called 3 times
      expect(CALLBACKS.DOWNLOAD_READY.calls.count()).toEqual(1);
      $timeout.flush();
      $httpBackend.flush();
      expect(CALLBACKS.DOWNLOAD_READY.calls.count()).toEqual(2);
      $timeout.flush();
      $httpBackend.flush();
      expect(CALLBACKS.DOWNLOAD_READY.calls.count()).toEqual(3);


      // ensure promise is resolved with correct values
      expect(printResultHandler).toHaveBeenCalledWith({
        mode: 'queue',
        url: DOWNLOAD_URL
      });

    });
  });

  describe('Testing PrintDirective', function() {

    var directiveElement, $compile, $rootScope, $scope, $q, printService, printPageService, mapService, defer;

    var OUTPUT_FORMATS = [{
      label: 'PNG',
      value: 'png'
    },
    {
      label: 'JPG',
      value: 'jpg'
    }];

    beforeEach(module('mocked-templates'));

    beforeEach(function() {

      module(function(PrintPageServiceProvider) {
        PrintPageServiceProvider.setPageLayouts([{
          id: 1,
          label: 'A4',
          icon: 'glyphicon-resize-vertical',
          mapSize: [190, 270],
          layout: 'a4-portrait'
        }, {
          id: 2,
          label: 'A4',
          icon: 'glyphicon-resize-horizontal',
          mapSize: [270, 190],
          layout: 'a4-landscape'
        }]);
        PrintPageServiceProvider.setAvailableScales([
          500, 1000, 2500
        ]);
        PrintPageServiceProvider.setDefaultScale(2500);
        PrintPageServiceProvider.setOutputFormats(OUTPUT_FORMATS);
      });

      inject(function($injector) {
        $rootScope = $injector.get('$rootScope');
        $scope = $rootScope.$new();
        $compile = $injector.get('$compile');
        $q = $injector.get('$q');
        printService = $injector.get('PrintService');
        printPageService = $injector.get('PrintPageService');
        mapService = $injector.get('MapService');
      });
      defer = $q.defer();

      // mock print service
      spyOn(printService, 'startPrint').and.returnValue(defer.promise);

      // mock print page service
      spyOn(printPageService, 'getBounds').and.returnValue([8, 52, 9, 53]);
      spyOn(printPageService, 'addFeatureFromPageSize');
      spyOn(printPageService, 'removePrintArea');

      spyOn(mapService, 'getMap').and.returnValue({
        getView: function() {
          return {
            getProjection: function() {
              return {
                getCode: function() {
                  return 'EPSG:4326';
                }
              };
            }
          };
        }
      });

      $rootScope.showPrintArea = false;
      var element = '<div anol-print="showPrintArea"></div>';
      directiveElement = $compile(element)($scope);
      $scope.$digest();
    });

    it('should have all page layouts', function() {
      var pageLayoutChoosers = $(directiveElement).find('div.form-group div.btn-group button.btn.btn-default.btn-sm');
      expect(pageLayoutChoosers.length).toBe(2);
      expect($(pageLayoutChoosers[0]).find('span').hasClass('glyphicon-resize-vertical')).toBe(true);
      expect($(pageLayoutChoosers[1]).find('span').hasClass('glyphicon-resize-horizontal')).toBe(true);
    });

    it('should have selected layout', function() {
      var pageLayoutChoosers = $(directiveElement).find('div.form-group div.btn-group button.btn.btn-default.btn-sm');
      $(pageLayoutChoosers[0]).trigger('click');

      expect(directiveElement.isolateScope().printAttributes.pageSize).toEqual([190, 270]);
      expect(directiveElement.isolateScope().printAttributes.layout).toBe('a4-portrait');
      expect(printPageService.addFeatureFromPageSize).toHaveBeenCalled();
    });

    it('should have defined scales', function() {
      var scaleOptions = $(directiveElement).find('#scale option');
      expect(scaleOptions.length).toBe(3);
      expect(scaleOptions[0].value).toBe('number:500');
      expect(scaleOptions[0].innerHTML).toBe('1 : 500');
      expect(scaleOptions[1].value).toBe('number:1000');
      expect(scaleOptions[1].innerHTML).toBe('1 : 1000');
      expect(scaleOptions[2].value).toBe('number:2500');
      expect(scaleOptions[2].innerHTML).toBe('1 : 2500');
      expect(scaleOptions[2].selected).toBe(true);
    });

    it('should have defined formats', function() {
      var formatOptions = $(directiveElement).find('#format option');
      expect(formatOptions.length).toBe(2);
      // TODO find a way to test against angular objects
      // values are angular objects
      expect(formatOptions[0].innerHTML).toBe('PNG');
      expect(formatOptions[1].innerHTML).toBe('JPG');
    });

    it('should pass expected values to PrintService and add download link correct', function() {
      var pageLayoutChoosers = $(directiveElement).find('div.form-group div.btn-group button.btn.btn-default.btn-sm');
      $(pageLayoutChoosers[0]).trigger('click');
      var startPrintButton = $(directiveElement).find('.start-print-button');
      startPrintButton.trigger('click');

      expect(printPageService.getBounds).toHaveBeenCalled();
      expect(printService.startPrint).toHaveBeenCalledWith({
        bbox: [8, 52, 9, 53],
        projection: 'EPSG:4326',
        // we don't have mocked LayerServices, so we have no layer
        layers: [undefined],
        templateValues: {
          outputFormat: {label: 'PNG', value: 'png'},
          scale: 2500,
          layout: 'a4-portrait',
          pageSize: [190, 270]
        }
      });
      expect(printPageService.removePrintArea).not.toHaveBeenCalled();
      // simulate download ready
      defer.resolve({
        url: '/foo/bar',
        name: 'foobar'
      });
      $scope.$digest();

      expect(printPageService.removePrintArea).toHaveBeenCalled();
      var downloadLink = $(directiveElement).find('.download-link');
      expect(downloadLink.length).toBe(1);
      expect(downloadLink.attr('href')).toBe('/foo/bar');
      expect(downloadLink.attr('download')).toBe('foobar');
    });
  });

  describe('Testing PrintPageService', function() {});
});