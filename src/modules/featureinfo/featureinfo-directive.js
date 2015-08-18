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
 * Makes GetFeatureInfo request on all layers with 'getFeatureInfo' property
 * and show result depending on 'target' specified in 'getFeatureInfo'
 *
 * Layer property **getFeatureInfo** - {Object} - Contains properties:
 * - **target** - {string} - Target for getFeatureInfo result. ('_blank', '_popup', [element-id])
 */
.directive('anolFeatureInfo', ['$compile', '$http', '$window', 'MapService', 'LayersService', function($compile, $http, $window, MapService, LayersService) {
    return {
        restrict: 'A',
        require: '?^anolMap',
        replace: true,
        scope: {},
        templateUrl: 'src/modules/featureinfo/templates/popup.html',
        link: {
            pre: function(scope, element) {
                $compile(element.contents())(scope);

                scope.map = MapService.getMap();
                var view = scope.map.getView();
                var popupContent = element.find('#popup-content');
                var popupOverlay = new ol.Overlay({
                    element: element.context,
                    autoPan: true,
                    autoPanAnimation: {
                        duration: 250
                    }
                });

                scope.map.addOverlay(popupOverlay);

                scope.handlePopupClose = function() {
                    element.css('display', 'none');
                };

                scope.handleClick = function(evt) {
                    var viewResolution = view.getResolution();
                    var coordinate = evt.coordinate;
                    var divTargetCleared = false;

                    element.css('display', 'none');
                    popupContent.empty();

                    angular.forEach(LayersService.layers, function(layer) {
                        var featureInfo = layer.get('getFeatureInfo');
                        if(angular.isUndefined(featureInfo)) {
                            return;
                        }
                        var url = layer.getSource().getGetFeatureInfoUrl(
                            coordinate, viewResolution, view.getProjection(),
                            {'INFO_FORMAT': 'text/html'}
                        );
                        if(angular.isDefined(url)) {
                            $http.get(url).success(function(response) {
                                if(angular.isString(response) && response !== '') {
                                    var iframe;
                                    if(featureInfo.target !== '_blank') {
                                        iframe = $('<iframe seamless src="' + url + '"></iframe>');
                                    }
                                    switch(featureInfo.target) {
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
                                            var target = $(featureInfo.target);
                                            if(divTargetCleared === false) {
                                                target.empty();
                                                divTargetCleared = true;
                                            }
                                            target.append(iframe);
                                        break;
                                    }
                                }
                            });
                        }
                    });
                };
            },
            post: function(scope) {
                scope.map.on('singleclick', scope.handleClick, this);
            }
        }
    };
}]);
