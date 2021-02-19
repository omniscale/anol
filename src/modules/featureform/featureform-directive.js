import './module.js';

/**
 * @typedef {object} SelectOption
 * @property {string} label
 * @property {string} value
 */

/**
 * @typedef {object} FormField
 * @property {string} name the name of the property
 * @property {string} type the type of the input
 * @property {string} label the label of the input
 * @property {string[]} select the available options if type=='select'
 * @property {boolean} [required]
 */

angular.module('anol.featureform')
    /**
     * @ngdoc directive
     * @name anol.featureform.directive:anolFeatureForm
     *
     * @restrict A
     * @requires pascalprecht.$translate
     *
     * @param {string} templateUrl Url to template to use instead of default one
     * @param {ol.Feature} feature Feature to show properties for
     * @param {anol.layer.Feature} layer Layer of feature
     * @param {FormField[]} formFields The options for each form field
     * @param {Object<string, string>} formValues The values for each form field
     * @param {string} translationNamespace Namespace to use in translation table. Default "featureform".
     *
     * @description
     * Creates a form to edit defined feature properties.
     *
     */
    .directive('anolFeatureForm', ['$templateRequest', '$compile', '$translate',
        function($templateRequest, $compile, $translate) {
            return {
                restrict: 'A',
                require: '?^anolFeaturePopup',
                scope: {
                    'feature': '=',
                    'layer': '=', // TODO: is this needed?
                    'selects': '=', // TODO: is this needed?
                    'formFields': '=',
                    'formValues': '=',
                    'translationNamespace': '@' // TODO: is this needed?
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
                    //
                    // scope.$watch('formFields', function (formFields) {
                    //     console.log(formFields)
                    // });
                //     scope.translationNamespace = angular.isDefined(scope.translationNamespace) ?
                //         scope.translationNamespace : 'featureform';
                //
                //     scope.propertiesCollection = [];
                //
                //     var featureChangeHandler = function(feature) {
                //         var propertiesCollection = [];
                //         if(angular.isUndefined(scope.layer) || !angular.isObject(scope.layer.featureinfo)) {
                //             scope.propertiesCollection = propertiesCollection;
                //         } else {
                //             var properties = propertiesFromFeature(feature, scope.layer.name, scope.layer.featureinfo.properties);
                //             if(!angular.equals(properties, {})) {
                //                 propertiesCollection.push(properties);
                //             }
                //             scope.propertiesCollection = propertiesCollection;
                //         }
                //         if(FeaturePopupController !== null && scope.propertiesCollection.length === 0) {
                //             FeaturePopupController.close();
                //         }
                //     };
                //
                //     var selectsChangeHandler = function(selects) {
                //         var propertiesCollection = [];
                //         angular.forEach(selects, function(selectObj) {
                //             var layer = selectObj.layer;
                //             var features = selectObj.features;
                //             if(!angular.isObject(layer.featureinfo) || features.length === 0) {
                //                 return;
                //             }
                //             angular.forEach(features, function(feature) {
                //                 var properties = propertiesFromFeature(feature, layer.name, layer.featureinfo.properties);
                //                 if(!angular.equals(properties, {})) {
                //                     propertiesCollection.push(properties);
                //                 }
                //             });
                //         });
                //         scope.propertiesCollection = propertiesCollection;
                //         if(FeaturePopupController !== null && scope.propertiesCollection.length === 0) {
                //             FeaturePopupController.close();
                //         }
                //     };
                //
                //     scope.$watch('feature', featureChangeHandler);
                //     scope.$watchCollection('selects', selectsChangeHandler);
                }
            };
        }]);

    // .directive('urlOrText', [function() {
    //     return {
    //         restrict: 'E',
    //         scope: {
    //             url: '=value'
    //         },
    //         link: function(scope, element) {
    //             var isUrl = function(s) {
    //                 var regexp = /(http:\/\/|https:\/\/|www\.)/;
    //                 return regexp.test(s);
    //             };
    //             scope.$watch('url', function(url) {
    //                 var content = url;
    //                 if(isUrl(url)) {
    //                     content = $('<a href="' + url + '">' + url + '</a>');
    //                 }
    //                 element.html(content);
    //             });
    //         }
    //     };
    // }]);
