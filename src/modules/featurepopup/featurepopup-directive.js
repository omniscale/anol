angular.module('anol.featurepopup')
/**
 * @ngdoc directive
 * @name anol.featurepopup.directive:anolFeaturePopip
 *
 * @restrict A
 *
 * @param {string} templateUrl Url to template to use instead of default one
 * @param {function} openCallback Function to run before popup is opened. If function returns false, no popup is shown
 *
 * @description
 * Shows a modal for editing feature properties
 */
.directive('anolFeaturePopup', ['$timeout', 'MapService', 'LayersService', 'ControlsService', function($timeout, MapService, LayersService, ControlsService) {
    return {
        restrict: 'A',
        scope: {
            'openCallback': '='
        },
        replace: true,
        transclude: true,
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/featurepopup/templates/popup.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        link: {
            pre: function(scope, element, attrs) {
                scope.map = MapService.getMap();
                scope.popupVisible = false;
                scope.feature = undefined;
                scope.layer = undefined;
                scope.overlayOptions = {
                    element: element[0],
                    autoPan: true,
                    autoPanAnimation: {
                        duration: 250
                    }

                };

                var featureAtPixel = function(evt) {
                    scope.map.forEachFeatureAtPixel(evt.pixel, function(feature, layer) {
                        if(!layer instanceof ol.layer.Vector) {
                            return;
                        }
                        scope.layer = layer.get('anolLayer');
                        if(angular.isObject(feature)) {
                            scope.feature = feature;
                        }

                    });
                };

                scope.handleClick = function(evt) {
                    scope.$apply(function() {
                        scope.popupVisible = false;
                    });
                    scope.feature = undefined;
                    scope.layer = undefined;
                    featureAtPixel(evt);
                    if(scope.feature === undefined) {
                        return;
                    }
                    if(angular.isFunction(scope.openCallback) && scope.openCallback(scope.feature, scope.layer) === false) {
                        return;
                    }
                    scope.$apply(function() {
                        scope.popupVisible = true;
                    });

                    // wait until scope changes applied ($digest cycle completed) before set popup position
                    // otherwise Overlay.autoPan is not work correctly
                    $timeout(function() {
                        scope.popup.setPosition(evt.coordinate);
                    });
                };
            },
            post: function(scope, element, attrs) {
                var handlerKey;

                scope.popup = new ol.Overlay(scope.overlayOptions);
                scope.map.addOverlay(scope.popup);

                scope.close = function() {
                    scope.popupVisible = false;
                };

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
