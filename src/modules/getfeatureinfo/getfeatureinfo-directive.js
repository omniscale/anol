angular.module('anol.getfeatureinfo')
/**
 * @ngdoc directive
 * @name anol.getfeatureinfo.directive:anolGetFeatureInfo
 *
 * @restrict A
 * @requires $http
 * @required $window
 * @requires anol.map.MapService
 * @requires anol.map.LayersService
 * @requires anol.map.ControlsService
 *
 * @description
 * Makes GetFeatureInfo request on all non vector layers with 'featureinfo' property
 * and show result if not empty depending on 'target' specified in 'featureinfo'
 *
 * @param {function} customTargetFilled Callback called after featureinfo result added to custom element
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {function} beforeRequest Callback called before featureinfo requests are fulfilled
 * @param {string} proxyUrl Url for proxy to use for requests.
                            When proxyUrl is used, name of requested anol layer
 *                          is appended as path to proxyUrl. E.g.: proxyUrl = '/foo', for layer with name 'bar' requested url is '/foo/bar/'.
 *                          Also only url params are submitted.
 *
 * Layer property **featureinfo** - {Object} - Contains properties:
 * - **target** - {string} - Target for featureinfo result. ('_blank', '_popup', [element-id])
 */
.directive('anolGetFeatureInfo', [
    '$http', '$window', '$q', '$compile', 'MapService', 'LayersService', 'ControlsService',
    function($http, $window, $q, $compile, MapService, LayersService, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            customTargetFilled: '&',
            beforeRequest: '&',
            proxyUrl: '@',
            popupOpeningDirection: '@',
            waitingMarkerSrc: '@?',
            waitingMarkerOffset: '=?'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/getfeatureinfo/templates/getfeatureinfo.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: {
            pre: function(scope, element) {
                scope.popupOpeningDirection = scope.popupOpeningDirection || 'top';

                scope.map = MapService.getMap();
                // get callback from wrapper function
                scope.customTargetCallback = scope.customTargetFilled();
                scope.beforeRequest = scope.beforeRequest();

                if(scope.waitingMarkerSrc !== undefined) {
                    scope.waitingOverlayElement = element.find('#get-featureinfo-waiting-overlay');
                    $compile(scope.waitingOverlayElement)(scope);
                    scope.waitingOverlay = new ol.Overlay({
                        element: scope.waitingOverlayElement[0],
                        position: undefined,
                        offset: scope.waitingMarkerOffset
                    });
                    scope.map.addOverlay(scope.waitingOverlay);
                }
                var view = scope.map.getView();

                if(angular.isDefined(scope.proxyUrl)) {
                    if(scope.proxyUrl[scope.proxyUrl.length - 1] !== '/') {
                        scope.proxyUrl += '/';
                    }
                }

                var handleFeatureinfoResponses = function(featureInfoObjects) {
                    var divTargetCleared = false;
                    var popupContentTemp = $('<div></div>');
                    var popupCoordinate;
                    angular.forEach(featureInfoObjects, function(featureInfoObject) {
                        if(angular.isUndefined(featureInfoObject)) {
                            return;
                        }
                        var iframe;
                        if(featureInfoObject.target === '_popup') {
                            iframe = $('<iframe seamless src="' + featureInfoObject.url + '"></iframe>');
                        }
                        switch(featureInfoObject.target) {
                            case '_blank':
                                $window.open(featureInfoObject.url, '_blank');
                            break;
                            case '_popup':
                                iframe.css('width', featureInfoObject.width || 300);
                                iframe.css('height', featureInfoObject.height || 150);
                                popupContentTemp.append(iframe);
                                popupCoordinate = featureInfoObject.coordinate;
                            break;
                            default:
                                var temp = $('<div></div>');
                                var target = angular.element(featureInfoObject.target);
                                if(divTargetCleared === false) {
                                    target.empty();
                                    divTargetCleared = true;
                                }
                                var content = angular.element(featureInfoObject.response);
                                temp.append(content);
                                temp.find('meta').remove();
                                temp.find('link').remove();
                                temp.find('title').remove();
                                temp.find('script').remove();
                                target.append(temp.children());
                                if(angular.isFunction(scope.customTargetCallback)) {
                                    scope.customTargetCallback();
                                }
                            break;
                        }
                    });
                    if(angular.isDefined(popupCoordinate)) {
                        scope.popupProperties = {
                            coordinate: popupCoordinate,
                            content: popupContentTemp.children()
                        };
                    }
                    scope.hideWaitingOverlay();
                };

                scope.handleClick = function(evt) {
                    var viewResolution = view.getResolution();
                    var coordinate = evt.coordinate;

                    scope.popupProperties = {coordinate: undefined};

                    if(angular.isFunction(scope.beforeRequest)) {
                        scope.beforeRequest();
                    }

                    scope.showWaitingOverlay(coordinate);

                    var requestPromises = [];
                    // this is resolved after all requests started
                    var requestsDeferred = $q.defer();
                    requestsDeferred.promise.then(function() {
                        // promises added before requests started
                        // all promises will be resolved, otherwise we can't access the data
                        // promises that should be rejected will be resolved with undefined
                        $q.all(requestPromises).then(handleFeatureinfoResponses);
                    });

                    angular.forEach(LayersService.flattedLayers(), function(layer) {
                        if(!layer.getVisible()) {
                            return;
                        }
                        if(layer.olLayer instanceof ol.layer.Vector) {
                            return;
                        }
                        if(!layer.featureinfo) {
                            return;
                        }

                        var requestParams ={
                            'INFO_FORMAT': 'text/html'
                        };
                        if(angular.isDefined(layer.featureinfo.featureCount)) {
                            requestParams.FEATURE_COUNT = layer.featureinfo.featureCount;
                        }

                        var url = layer.getFeatureInfoUrl(
                            coordinate, viewResolution, view.getProjection(), requestParams
                        );
                        if(angular.isDefined(scope.proxyUrl)) {
                            url = scope.proxyUrl + layer.name + '/?' + url.split('?')[1];
                        }
                        if(angular.isDefined(url)) {
                            var requestDeferred = $q.defer();
                            requestPromises.push(requestDeferred.promise);
                            $http.get(url).then(
                                function(response) {
                                    if(angular.isString(response.data) && response.data !== '' && response.data.search('^\s*<\?xml') === -1) {
                                        requestDeferred.resolve({
                                            target: layer.featureinfo.target,
                                            width: layer.featureinfo.width,
                                            height: layer.featureinfo.height,
                                            url: url,
                                            response: response.data,
                                            coordinate: coordinate
                                        });
                                    } else {
                                        requestDeferred.resolve();
                                    }
                                },
                                function(response) {
                                    requestDeferred.resolve();
                                }
                            );
                        }
                    });
                    requestsDeferred.resolve();
                };

                scope.hideWaitingOverlay = function() {
                    if(scope.waitingMarkerSrc !== undefined) {
                        scope.waitingOverlay.setPosition(undefined);
                    }
                };

                scope.showWaitingOverlay = function(coordinate) {
                    if(scope.waitingMarkerSrc !== undefined) {
                        scope.waitingOverlay.setPosition(coordinate);
                    }
                };
            },
            post: function(scope) {
                var handlerKey;
                var control = new anol.control.Control({
                    subordinate: true,
                    olControl: null
                });
                control.onDeactivate(function() {
                    scope.map.unByKey(handlerKey);
                });
                control.onActivate(function() {
                    handlerKey = scope.map.on('singleclick', scope.handleClick, this);
                });

                control.activate();

                ControlsService.addControl(control);
            }
        }
    };
}]);
