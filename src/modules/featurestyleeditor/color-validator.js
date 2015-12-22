angular.module('anol.featurestyleeditor')

.directive('color', function() {
    var COLOR_REGEX = /^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/;
    return {
        require: 'ngModel',
        link: function(scope, elem, attrs, ctrl) {
            ctrl.$validators.color = function(modelValue, viewValue) {
                if(ctrl.$isEmpty(modelValue)) {
                    return true;
                }
                if(ctrl.$isEmpty(viewValue)) {
                    return false;
                }
                var result =  COLOR_REGEX.test(viewValue);
                return result;
            };
        }
    };
});
