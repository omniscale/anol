angular.module('anol.print')
/**
 * @ngdoc directive
 * @name anol.print.directive:anolPrint
 *
 * @requires anol.map.MapService
 * @requires anol.map.LayersService
 * @requires anol.print.PrintService
 * @requires anol.print.PrintPageService
 *
 * @description
 * User print interface with default print attributes.
 * Default print attributes are:
 * **bbox**, **projection** and **layers**.
 * **layers** contains all currently active layers.
 *
 * When *startPrint* called default print arguments plus **tempalteValues** passed to anol.print.PrintService:startPrint.
 * **templateValues** contains all values added to **printAttributes**.
 * When using own print template, all inputs have to use **printAttributes.[name]** as *ng-model* statement.
 * *tempalteValues* can be extended by transclude input fields into directive. *ng-model* value for these fields have to be
 * *$parent.printAttributes.[name]*
 */
.directive('anolPrint', ['PrintService', 'PrintPageService', 'MapService', 'LayersService',
  function(PrintService, PrintPageService, MapService, LayersService) {
    return {
      restrict: 'A',
      templateUrl: function(tElement, tAttrs) {
        var defaultUrl = 'src/modules/print/templates/print.html';
        return tAttrs.templateUrl || defaultUrl;
      },
      scope: {
        showPrintArea: '='
      },
      transclude: true,
      link: {
        pre: function(scope, element, attrs) {
            scope.printAttributes = {
              pageSize: [],
              pageSizeId: undefined,
              scale: angular.copy(PrintPageService.defaultScale)
            };
            scope.definedPageSizes = PrintPageService.pageSizes;
            scope.outputFormats = PrintPageService.outputFormats;
            if(angular.isArray(scope.outputFormats) && scope.outputFormats.length > 0) {
              scope.printAttributes.outputFormat = scope.outputFormats[0];
            }
            scope.prepareDownload = false;
            scope.downloadReady = false;
            scope.downloadError = false;

            var prepareOverlays = function(layers) {
              var _layers = [];
              angular.forEach(layers, function(layer) {
                if(layer instanceof anol.layer.Group) {
                  _layers = _layers.concat(prepareOverlays(layer.layers));
                } else {
                  if(layer.displayInLayerswitcher && layer.getVisible()) {
                    _layers.push(layer);
                  }
                }
              });
              return _layers;
            };

            scope.startPrint = function() {
              scope.downloadReady = false;
              scope.downloadError = false;
              scope.prepareDownload = true;

              var layers = [LayersService.activeBackgroundLayer()];
              layers = layers.concat(prepareOverlays(LayersService.overlayLayers));

              var downloadPromise = PrintService.startPrint({
                  bbox: PrintPageService.getBounds(),
                  projection: MapService.getMap().getView().getProjection().getCode(),
                  layers: layers,
                  templateValues: angular.copy(scope.printAttributes)
                }
              );

              downloadPromise.then(
                function(downloadUrl) {
                  element.find('.download-link').attr('href', downloadUrl);
                  scope.downloadReady = true;
                  scope.prepareDownload = false;
                  scope.removePrintArea();
                },
                function() {
                  scope.prepareDownload = false;
                  scope.downloadError = true;
                }
              );
            };

            // if we assign pageSize = value in template angular put only a reverence
            // into scope.pageSize and typing somethink into width/height input fields
            // will result in modifying selected availablePageSize value
            scope.setPageSize = function(size, id) {
                scope.printAttributes.pageSize = angular.copy(size);
                scope.printAttributes.pageSizeId = angular.copy(id);
                scope.updatePrintPage();
            };

            scope.updatePrintPage = function() {
              PrintPageService.addFeatureFromPageSize(scope.printAttributes.pageSize, scope.printAttributes.scale);
            };
            scope.havePageSize = function() {
              if(scope.printAttributes.pageSize === undefined) {
                  return false;
              }
              if(scope.printAttributes.pageSize[0] === undefined || scope.printAttributes.pageSize[0] <= 0) {
                  return false;
              }
              if(scope.printAttributes.pageSize[1] === undefined || scope.printAttributes.pageSize[1] <= 0) {
                  return false;
              }
              return true;
            };
            scope.isPrintable = function() {
              if(scope.printAttributes.scale === undefined || scope.printAttributes.scale <= 0) {
                  return false;
              }
              if(scope.printAttributes.outputFormat === undefined) {
                return false;
              }
              return scope.havePageSize();
            };
            scope.removePrintArea = function() {
              PrintPageService.removePrintArea();
              scope.printAttributes.pageSizeId = undefined;
              scope.printAttributes.pageSize = undefined;

            };
        },
        post: function(scope, element, attrs) {
          scope.$watch(
            function() {
              return PrintPageService.currentPageSize;
            },
            function(n) {
              if(angular.isDefined(n)) {
                scope.printAttributes.pageSize = n;
              }
            }
          );
          scope.$watch('showPrintArea', function(n) {
            if(n === true) {
              scope.updatePrintPage();
            } else if (n === false) {
              scope.removePrintArea();
            }
          });
        }
      }
  };
}]);
