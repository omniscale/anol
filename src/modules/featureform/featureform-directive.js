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
     * @param {FormField[]} pointFields The form fields for points
     * @param {FormField[]} lineFields The form fields for lines
     * @param {FormField[]} polygonFields The form fields for polygons
     * @param {boolean} [highlightInvalid] show if fields are invalid
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
                    'pointFields': '=?',
                    'lineFields': '=?',
                    'polygonFields': '=?',
                    'highlightInvalid': '=?'
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

                    scope.formFields = [];
                    scope.properties = {};

                    var propertyWatchers = [];

                    /**
                     * @param {ol.Feature} feature
                     */
                    var featureChangeHandler = function (feature) {
                        clearPropertiesWatchers();
                        if (feature) {
                            scope.properties = feature.getProperties();
                            const geomType = feature.getGeometry().getType();
                            if (geomType === 'Point') {
                                scope.formFields = scope.pointFields;
                            } else if (geomType === 'LineString') {
                                scope.formFields = scope.lineFields;
                            } else if (geomType === 'Polygon') {
                                scope.formFields = scope.polygonFields;
                            }
                            setupPropertiesWatchers(scope.formFields);
                        }
                    };

                    /**
                     * @param {FormField[]} formFields
                     */
                    var setupPropertiesWatchers = function (formFields) {
                        formFields.forEach(function (field) {
                            var watcher = scope.$watch('properties["' + field.name + '"]', function (value) {
                                scope.feature.set(field.name, value);
                            });
                            propertyWatchers.push(watcher);
                        });
                    };

                    var clearPropertiesWatchers = function () {
                        propertyWatchers.forEach(function (dewatch) {
                            dewatch();
                        });
                        propertyWatchers = [];
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

                    /**
                     * @param {FormField} field
                     * @return {boolean}
                     */
                    scope.isValid = function (field) {
                        if (field.required) {
                            return !!scope.properties[field.name];
                        }
                        return true;
                    };

                    scope.$watch('feature', featureChangeHandler);
                }
            };
        }]);
