require('angular');

import { defaults } from './module.js';
import GeoJSON from 'ol/format/GeoJSON';

angular.module('anol.featureexchange')

/**
 * @ngdoc directive
 * @name anol.featureexchange.directive:anolFeatureexchange
 *
 * @restrict A
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {string} filename Name of downloaded file
 * @param {function} preDownload Function executed before download provided
 * @param {function} postUpload Function executed after file uploaded
 * @param {string} srs Coordinate system to export features in / load features from
 *
 * @description
 * Download features as geojson
 */
.directive('anolFeatureexchange', ['$translate', '$rootScope', 'MapService', function($translate, $rootScope, MapService) {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            layer: '=',
            filename: '=',
            preDownload: '=',
            postUpload: '=',
            srs: '@'
        },
        template: function(tElement, tAttrs) {
            if (tAttrs.templateUrl) {
                return tAttrs.templateUrl;
            }
            return require('./templates/featureexchange.html')
        },        
        link: function(scope, element, attrs) {
            var format = new GeoJSON();
            var fileselector = element.find('#fileselector');
            var uploadErrorElement = element.find('#upload-error');

            var showError = function(errorMessage) {
                uploadErrorElement.text(errorMessage);
                uploadErrorElement.removeClass('hide');
            };

            scope.download = function() {
                if(scope.layer instanceof anol.layer.Feature) {
                    var geojson = format.writeFeaturesObject(scope.layer.getFeatures(), {
                        featureProjection: MapService.getMap().getView().getProjection(),
                        dataProjection: scope.srs || 'EPSG:4326'
                    });
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
                    uploadErrorElement.addClass('hide');
                    uploadErrorElement.empty();
                    fileselector.val('');
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
                    var featureCollection;
                    try {
                        featureCollection = JSON.parse(e.target.result);
                    } catch(err) {
                        showError(scope.errorMessages.noJsonFormat);
                        return;
                    }
                    if(angular.isUndefined(featureCollection.features) || !angular.isArray(featureCollection.features)) {
                        showError(scope.errorMessages.invalidGeoJson);
                        return;
                    }
                    if(featureCollection.features.length === 0) {
                        showError(scope.errorMessages.emptyGeoJson);
                        return;
                    }
                    if(angular.isFunction(scope.postUpload)) {
                        featureCollection = scope.postUpload(featureCollection);
                    }
                    var features = format.readFeatures(featureCollection, {
                        featureProjection: MapService.getMap().getView().getProjection(),
                        dataProjection: scope.srs || 'EPSG:4326'
                    });
                    scope.layer.clear();
                    scope.layer.addFeatures(features);
                };
                fileReader.onerror = function(e) {
                    showError(scope.errorMessages.couldNotReadFile);
                };
                fileReader.readAsText(files[0]);
            });

            var translate = function() {
                $translate([
                    'anol.featureexchange.NO_JSON_FORMAT',
                    'anol.featureexchange.INVALID_GEOJSON',
                    'anol.featureexchange.EMPTY_GEOJSON',
                    'anol.featureexchange.COULD_NOT_READ_FILE'
                ]).then(function(translations) {
                    scope.errorMessages = {
                        noJsonFormat: translations['anol.featureexchange.NO_JSON_FORMAT'],
                        invalidGeoJson: translations['anol.featureexchange.INVALID_GEOJSON'],
                        emptyGeoJson: translations['anol.featureexchange.EMPTY_GEOJSON'],
                        couldNotReadFile: translations['anol.featureexchange.COULD_NOT_READ_FILE']
                    };
                });
            };
            $rootScope.$on('$translateChangeSuccess', translate);
            translate();
        }
    };
}]);