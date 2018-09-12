import { defaults } from './module.js';
import Overlay from 'ol/Overlay';

angular.module('anol.urlmarkers')

    .directive('anolUrlMarkers', ['$compile', 'UrlMarkersService', 'MapService', function($compile, UrlMarkersService, MapService) {
        return function(scope) {
            if(!UrlMarkersService.usePopup) {
                return;
            }

            var overlays = [];

            var popupTemplate = '<div class="anol-popup top>' +
                            '<span class="anol-popup-closer glyphicon glyphicon-remove" ng-mousedown="$event.stopPropagation();"></span>' +
                            '<div class="anol-popup-content" bbcode>' +
                            '</div>' +
                            '</div>';

            angular.forEach(UrlMarkersService.features, function(feature) {
                if (feature.get('label')) {
                    var overlayTemplate = angular.element(angular.copy(popupTemplate));
                    overlayTemplate.find('.anol-popup-content').text(feature.get('label'));
                    var overlayElement = $compile(overlayTemplate)(scope);
                    var overlay = new Overlay({
                        element: overlayElement[0],
                        autoPan: false
                    });
                    overlayElement.find('.anol-popup-closer').click(function() {
                        MapService.getMap().removeOverlay(overlay);
                    });
                    angular.element(overlay.getElement()).parent().addClass('anol-popup-container');
                    MapService.getMap().addOverlay(overlay);

                    overlay.setPosition(feature.getGeometry().getCoordinates());
                    overlays.push(overlay);
                }
            });
        };
    }]);
