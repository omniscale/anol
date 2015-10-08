angular.module('anol.featureinfo')
/**
 * @ngdoc directive
 * @name anol.featureinfo.directive:anolFeatureInfo
 *
 * @restrict A
 * @requires $compile
 * @requires $http
 * @required $window
 * @requires anol.map.MapService
 * @requires anol.map.LayersService
 *
 * @description
 * Makes GetFeatureInfo request on all non vector layers with 'featureinfo' property
 * and show result if not empty depending on 'target' specified in 'featureinfo'
 *
 * Layer property **featureinfo** - {Object} - Contains properties:
 * - **target** - {string} - Target for featureinfo result. ('_blank', '_popup', [element-id])
 */
.directive('anolFeatureInfo', ['$compile', '$http', '$window', 'MapService', 'LayersService', function($compile, $http, $window, MapService, LayersService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        replace: true,
        scope: {
            customTargetFilled: '&'
        },
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featureinfo/templates/popup.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: {
            pre: function(scope, element) {
                $compile(element.contents())(scope);

                scope.map = MapService.getMap();
                var view = scope.map.getView();
                var popupContent = element.find('.anol-popup-content');
                var popupOverlay = new ol.Overlay({
                    element: element.context,
                    autoPan: true,
                    autoPanAnimation: {
                        duration: 250
                    }
                });

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

                            var url = layer.olLayer.getSource().getGetFeatureInfoUrl(
                                coordinate, viewResolution, view.getProjection(),
                                {'INFO_FORMAT': 'text/html'}
                            );
                            if(angular.isDefined(url)) {
                                $http.get(url).success(function(response) {
                                    if(angular.isString(response) && response !== '' && !response.startsWith('<?xml')) {
                                        var iframe;
                                        if(layer.featureinfo.target !== '_blank') {
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
                                                var target = $(layer.featureinfo.target);
                                                if(divTargetCleared === false) {
                                                    target.empty();
                                                    divTargetCleared = true;
                                                }
                                                target.append(iframe);
                                                if(angular.isFunction(scope.customTargetFilled)) {
                                                    // first function call get function, we want to call
                                                    scope.customTargetFilled()();
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
                scope.map.on('singleclick', scope.handleClick, this);
            }
        }
    };
}]);
