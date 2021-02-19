import './module.js';

/**
 * @typedef {object} SelectOption
 * @property {string} [label]
 * @property {string} value
 */

/**
 * @typedef {object} FormField
 * @property {string} name the name of the property
 * @property {string} type the type of the input
 * @property {string} [label] the label of the input
 * @property {Array<SelectOption|string>} select the available options if type=='select'
 * @property {boolean} [required]
 */

angular.module('anol.featureform')
    /**
     * @ngdoc directive
     * @name anol.featureform.directive:anolFeatureForm
     *
     * @restrict A
     *
     * @param {string} templateUrl Url to template to use instead of default one
     * @param {ol.Feature} feature Feature to show properties for
     * @param {anol.layer.Feature} layer Layer of feature
     * @param {FormField[]} formFields The options for each form field
     * @param {Object<string, string>} formValues The values for each form field
     *
     * @description
     * Creates a form to edit defined feature properties.
     *
     */
    .directive('anolFeatureForm', ['$templateRequest', '$compile',
        function($templateRequest, $compile) {
            return {
                restrict: 'A',
                require: '?^anolFeaturePopup',
                scope: {
                    'feature': '=',
                    'layer': '=', // TODO: is this needed?
                    'formFields': '='
                },
                template: function(tElement, tAttrs) {
                    if (tAttrs.templateUrl) {
                        return '<div></div>';
                    }
                    return require('./templates/featureform.html');
                },
                link: function(scope, element, attrs, FeaturePopupController) {
                    if (attrs.templateUrl && attrs.templateUrl !== '') {
                        $templateRequest(attrs.templateUrl).then(function(html){
                            var template = angular.element(html);
                            element.html(template);
                            $compile(template)(scope);
                        });
                    }

                    scope.properties = {};

                    /**
                     * @param {ol.Feature} feature
                     */
                    var featureChangeHandler = function (feature) {
                        if (feature) {
                            scope.properties = feature.getProperties();
                        }
                    };

                    /**
                     * @param {FormField[]} formFields
                     */
                    var formFieldChangeHandler = function (formFields) {
                        formFields.forEach(function (field) {
                            scope.$watch('properties["' + field.name + '"]', function (value) {
                                scope.feature.set(field.name, value);
                            });
                        });
                    };

                    /**
                     * @param {SelectOption|string} option
                     * @return {string}
                     */
                    scope.getOptionValue = function (option) {
                        return angular.isObject(option) ? option.value : option;
                    };

                    /**
                     * @param {SelectOption|string} option
                     * @return {string}
                     */
                    scope.getOptionLabel = function (option) {
                        return angular.isObject(option) ? option.label || option.value : option;
                    };

                    scope.$watch('feature', featureChangeHandler);

                    scope.$watch('formFields', formFieldChangeHandler);
                }
            };
        }]);
