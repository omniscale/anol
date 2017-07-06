angular.module('anol.featureexchange')

/**
 * @ngdoc directive
 * @name anol.featureexchange.directive:anolFeatureexchange
 *
 * @restrict A
 *
 * @param {string} templateUrl Url to template to use instead of default one
 *
 * @description
 * Download features as geojson
 */
.directive('anolFeatureexchange', [function() {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            layer: '=',
            filename: '=',
            preDownload: '=',
            postUpload: '='
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featureexchange/templates/featureexchange.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: function(scope, element, attrs) {
            var format = new ol.format.GeoJSON();
            var fileselector = element.find('#fileselector');

            scope.download = function() {
                if(scope.layer instanceof anol.layer.Feature) {
                    var geojson = format.writeFeaturesObject(scope.layer.getFeatures());
                    if(angular.isFunction(scope.preDownload)) {
                        geojson = scope.preDownload(geojson);
                    }
                    geojson = JSON.stringify(geojson);
                    // ie
                    if(angular.isFunction(window.navigator.msSaveBlob)) {
                        var blobObject = new Blob([geojson]);
                        window.navigator.msSaveBlob(blobObject, scope.filename);
                    // other
                    } else {
                        var a = $('<a>Foo</a>');
                        a.attr('href', 'data:application/vnd.geo+json;charset=utf-8,' + encodeURIComponent(geojson));
                        a.attr('download', 'features.geojson');
                        a.css('display', 'none');
                        $('body').append(a);
                        a[0].click();
                        a.remove();
                    }
                }
            };

            scope.upload = function() {
                if(scope.layer instanceof anol.layer.Feature) {
                    fileselector[0].click();
                }
            };

            fileselector.change(function(e) {
                var files = e.target.files;
                if(files.length === 0) {
                    return;
                }
                var fileReader = new FileReader();
                fileReader.onload = function(e) {
                    var featureCollection = JSON.parse(e.target.result);
                    if(angular.isFunction(scope.postUpload)) {
                        featureCollection = scope.postUpload(featureCollection);
                    }
                    var features = format.readFeatures(featureCollection);
                    scope.layer.clear();
                    scope.layer.addFeatures(features);
                };
                fileReader.readAsText(files[0]);
            });
        }
    };
}]);