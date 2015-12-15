angular.module('anol.savemanager')

.directive('anolSavemanager', ['SaveManagerService', function(SaveManagerService) {
    return {
        restrict: 'A',
        templateUrl: function(tElement, tAttrs) {
            var defaultUrl = 'src/modules/savemanager/templates/savemanager.html';
            return tAttrs.templateUrl || defaultUrl;
        },
        scope: {},

        link: function(scope, element, attrs) {
            scope.unsavedLayers = SaveManagerService.changedLayers;

            scope.save = function(layer) {
                SaveManagerService.commit(layer).then(function() {
                    // TODO show success
                }, function() {
                    // TODO show or handle error
                });
            };
        }
    };
}]);