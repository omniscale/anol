import './module.js';

// TODO rename to popup
angular.module('anol.featurepopup')
/**
 * @ngdoc object
 * @name anol.map.PopupsServiceProvider
 */
    .provider('PopupsService', [function() {
        this.$get = [function() {
            var Popups = function() {
                this.popupScopes = [];
                this.dragPopupOptions = [];
            };
            Popups.prototype.register = function(popupScope) {
                this.popupScopes.push(popupScope);
            };
            Popups.prototype.closeAll = function() {
                angular.forEach(this.popupScopes, function(popupScope) {
                    popupScope.close();
                });
            };
            Popups.prototype.makeDraggable = function(popupScope, position, feature, layer, selects, event) {
                var dragPopupOptions = {
                    screenPosition: position,
                    feature: feature,
                    layer: layer,
                    selects: selects,
                    event: event
                };
                popupScope.close();
                this.dragPopupOptions.push(dragPopupOptions);
            };
            return new Popups();
        }];
    }]);
