angular.module('anol.featurepopup')

/**
 * @ngdoc object
 * @name anol.map.PopupsServiceProvider
 */
.provider('PopupsService', [function() {
    this.$get = [function() {
        var Popups = function() {
            this.popupScopes = [];
        };
        Popups.prototype.register = function(popupScope) {
            this.popupScopes.push(popupScope);
        };
        Popups.prototype.closeAll = function() {
            angular.forEach(this.popupScopes, function(popupScope) {
                popupScope.close();
            });
        };
        return new Popups();
    }];
}]);
