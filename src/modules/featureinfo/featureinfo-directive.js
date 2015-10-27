angular.module('anol.featureinfo')
/**
 * @ngdoc directive
 * @name anol.featureinfo.directive:anolFeatureInfo
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
.directive('anolFeatureInfo', [
    '$http', '$window', 'MapService', 'LayersService', 'ControlsService',
    function($http, $window, MapService, LayersService, ControlsService) {
    return {
        restrict: 'A',
        replace: true,
        scope: {
            customTargetFilled: '&',
            beforeRequest: '&',
            proxyUrl: '@'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featureinfo/templates/popup.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: {
            pre: function(scope, element) {
                scope.map = MapService.getMap();
                // get callback from wrapper function
                scope.customTargetCallback = scope.customTargetFilled();
                scope.beforeRequest = scope.beforeRequest();
                var view = scope.map.getView();
                var popupContent = element.find('.anol-popup-content');
                var popupOverlay = new ol.Overlay({
                    element: element.context,
                    autoPan: true,
                    autoPanAnimation: {
                        duration: 250
                    }
                });

                if(angular.isDefined(scope.proxyUrl) && !scope.proxyUrl.endsWith('/')) {
                    scope.proxyUrl += '/';
                }

                scope.map.addOverlay(popupOverlay);

                scope.close = function() {
                    element.css('display', 'none');
                };

                scope.handleClick = function(evt) {
                    var viewResolution = view.getResolution();
                    var coordinate = evt.coordinate;
                    var divTargetCleared = false;

                    element.css('display', 'none');
                    popupContent.empty();

                    if(angular.isFunction(scope.beforeRequest)) {
                        scope.beforeRequest();
                    }

                    angular.forEach(LayersService.layers, function(layer) {
                        var layers = [layer];
                        if(layer instanceof anol.layer.Group) {
                            layers = layer.layers;
                        }
                        angular.forEach(layers, function(layer) {
                            if(!layer.getVisible()) {
                                return;
                            }
                            if(layer.olLayer instanceof ol.layer.Vector) {
                                return;
                            }
                            if(!layer.featureinfo) {
                                return;
                            }

                            // TODO do not request each layer seperate
                            var params = layer.olLayer.getSource().getParams();
                            var queryLayers = params.layers || params.LAYERS;
                            queryLayers = queryLayers.split(',');

                            var url = layer.olLayer.getSource().getGetFeatureInfoUrl(
                                coordinate, viewResolution, view.getProjection(),
                                {
                                    'INFO_FORMAT': 'text/html',
                                    'QUERY_LAYERS': queryLayers
                                }
                            );
                            if(angular.isDefined(scope.proxyUrl)) {
                                url = scope.proxyUrl + layer.name + '/?' + url.split('?')[1];
                            }
                            if(angular.isDefined(url)) {
                                $http.get(url).success(function(response) {
                                    if(angular.isString(response) && response !== '' && !response.startsWith('<?xml')) {
                                        var iframe;
                                        if(layer.featureinfo.target === '_popup') {
                                            iframe = $('<iframe seamless src="' + url + '"></iframe>');
                                        }
                                        switch(layer.featureinfo.target) {
                                            case '_blank':
                                                $window.open(url, '_blank');
                                            break;
                                            case '_popup':
                                                popupContent.append(iframe);
                                                if(element.css('display') === 'none') {
                                                    element.css('display', '');
                                                    popupOverlay.setPosition(coordinate);
                                                }
                                            break;
                                            default:
                                                var temp = $('<div></div>');
                                                var target = angular.element(layer.featureinfo.target);
                                                if(divTargetCleared === false) {
                                                    target.empty();
                                                    divTargetCleared = true;
                                                }
                                                var content = angular.element(response);
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
                                    }
                                });
                            }
                        });
                    });
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
